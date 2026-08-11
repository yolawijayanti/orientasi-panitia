import type { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import {
  budgetLengkapEmail,
  instanceSelesaiEmail,
  taskAssignedEmail,
} from "@/lib/notifications/templates";
import { isInstanceFullyComplete } from "@/lib/notifications/instance-progress";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function alreadyNotified(
  supabase: SupabaseClient,
  kepanitiaanSiteId: string,
  jenis: "budget_lengkap" | "instance_selesai",
): Promise<boolean> {
  const { data } = await supabase
    .from("notifications_log")
    .select("id")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
    .eq("jenis", jenis)
    .limit(1)
    .maybeSingle();

  return data !== null;
}

async function loadInstanceLabel(
  supabase: SupabaseClient,
  kepanitiaanSiteId: string,
): Promise<string> {
  const { data } = await supabase
    .from("kepanitiaan_site")
    .select("kepanitiaan(nama), site:sites(nama_site)")
    .eq("id", kepanitiaanSiteId)
    .maybeSingle();

  const row = data as unknown as {
    kepanitiaan: { nama: string } | null;
    site: { nama_site: string } | null;
  } | null;

  const kepanitiaanNama = row?.kepanitiaan?.nama ?? "Kepanitiaan";
  const siteNama = row?.site?.nama_site ?? "Site tidak diketahui";
  return `${kepanitiaanNama} @ ${siteNama}`;
}

async function getLeaderEmails(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.rpc("list_leader_emails");
  return (data ?? []) as string[];
}

/**
 * Semua akun panitia YANG SUDAH TERDAFTAR (`public.users`) di instance ini
 * -- reuse RPC `list_akun_panitia_instance` yang sudah ada sejak Fase 4
 * (dipakai awalnya untuk dropdown "+ Tambah Anggota"). Ini SENGAJA
 * mengembalikan akun LOGIN, bukan baris `committee_members` -- kalau ada
 * anggota yang tercatat di Susunan Panitia tapi belum punya akun login,
 * dia tidak akan kebagian email lewat jalur ini (beda dari task_assigned/
 * reminder_deadline yang kirim ke committee_members.email langsung, tidak
 * butuh akun login sama sekali) -- diterima sebagai batasan, karena tanpa
 * akun `public.users` kita tidak punya cara resmi tahu ini "penerima yang
 * valid" (lihat catatan Fase 5 soal insiden akun test yang tercatat di
 * Susunan Panitia tapi tidak bisa login).
 */
async function getPanitiaEmails(supabase: SupabaseClient, kepanitiaanSiteId: string) {
  const { data } = await supabase.rpc("list_akun_panitia_instance", {
    p_kepanitiaan_site_id: kepanitiaanSiteId,
  });
  return ((data ?? []) as { id: string; email: string }[]).map((row) => row.email);
}

/**
 * Leader + SELURUH panitia terdaftar di instance ini -- dipakai untuk
 * budget_lengkap/instance_selesai, yang sifatnya broadcast satu instance
 * (bukan personal ke 1 orang seperti reminder_deadline/task_assigned).
 * `Set` untuk dedupe kalau kebetulan ada alamat yang sama di kedua daftar.
 */
async function getInstanceBroadcastEmails(supabase: SupabaseClient, kepanitiaanSiteId: string) {
  const [leaderEmails, panitiaEmails] = await Promise.all([
    getLeaderEmails(supabase),
    getPanitiaEmails(supabase, kepanitiaanSiteId),
  ]);
  return [...new Set([...leaderEmails, ...panitiaEmails])];
}

/**
 * Dipanggil langsung dari `submitBudget` setelah status baris
 * `budget_submissions` disimpan sebagai "lengkap" -- ini yang membuatnya
 * event-based (fire tepat saat trigger terjadi), bukan polling berkala.
 * Dedupe lewat `notifications_log`: kalau instance ini SUDAH pernah kirim
 * notifikasi `budget_lengkap` sebelumnya, tidak dikirim ulang -- upload
 * ulang/ganti file submission (yang statusnya tetap "lengkap") tidak akan
 * mengirim email kedua kalinya.
 */
export async function notifyBudgetLengkap(supabase: SupabaseClient, kepanitiaanSiteId: string) {
  if (await alreadyNotified(supabase, kepanitiaanSiteId, "budget_lengkap")) return;

  const [instanceLabel, recipients] = await Promise.all([
    loadInstanceLabel(supabase, kepanitiaanSiteId),
    getInstanceBroadcastEmails(supabase, kepanitiaanSiteId),
  ]);

  const { subject, html } = budgetLengkapEmail(instanceLabel);
  await sendEmail(recipients, subject, html);

  await supabase.from("notifications_log").insert({
    kepanitiaan_site_id: kepanitiaanSiteId,
    jenis: "budget_lengkap",
    ref_type: "kepanitiaan_site",
    ref_id: kepanitiaanSiteId,
  });
}

/**
 * Dipanggil setelah update/hapus task/subtask yang berpotensi membuat satu
 * instance jadi 100% selesai. Dedupe sama seperti notifyBudgetLengkap --
 * cuma kirim SEKALI per instance per pencapaian pertama kali 100%. Kalau
 * instance sempat turun dari 100% (misal tambah tugas baru) lalu balik ke
 * 100% lagi, tidak dikirim ulang -- keputusan sengaja, lihat catatan
 * teknis Fase 7 di HANDOVER.md.
 */
export async function notifyInstanceSelesai(supabase: SupabaseClient, kepanitiaanSiteId: string) {
  if (await alreadyNotified(supabase, kepanitiaanSiteId, "instance_selesai")) return;

  const [instanceLabel, recipients] = await Promise.all([
    loadInstanceLabel(supabase, kepanitiaanSiteId),
    getInstanceBroadcastEmails(supabase, kepanitiaanSiteId),
  ]);

  const { subject, html } = instanceSelesaiEmail(instanceLabel);
  await sendEmail(recipients, subject, html);

  await supabase.from("notifications_log").insert({
    kepanitiaan_site_id: kepanitiaanSiteId,
    jenis: "instance_selesai",
    ref_type: "kepanitiaan_site",
    ref_id: kepanitiaanSiteId,
  });
}

/**
 * Dipanggil dari addTask/updateTask/addSubtask/updateSubtask setelah
 * `assignee_id` berubah jadi seseorang yang BARU (bukan re-save assignee
 * yang sama) -- pengecekan "apa ini benar-benar baru" dilakukan di
 * pemanggil (lib/tasks/actions.ts), bukan di sini. Tidak butuh
 * `kepanitiaan_site_id` sebagai parameter -- cukup `assigneeId`, karena
 * baris `committee_members` sudah punya kolom itu sendiri.
 */
export async function notifyTaskAssigned(
  supabase: SupabaseClient,
  params: {
    assigneeId: string;
    refType: "task" | "subtask";
    refId: string;
    judul: string;
    deadline: string | null;
  },
) {
  const { data: member } = await supabase
    .from("committee_members")
    .select("email, kepanitiaan_site_id")
    .eq("id", params.assigneeId)
    .maybeSingle();

  if (!member?.email) return;

  const instanceLabel = await loadInstanceLabel(supabase, member.kepanitiaan_site_id);
  const { subject, html } = taskAssignedEmail({
    judul: params.judul,
    jenisItem: params.refType === "task" ? "tugas" : "subtugas",
    deadline: params.deadline,
    instanceLabel,
  });
  await sendEmail(member.email, subject, html);

  await supabase.from("notifications_log").insert({
    kepanitiaan_site_id: member.kepanitiaan_site_id,
    jenis: "task_assigned",
    ref_type: params.refType,
    ref_id: params.refId,
    recipient_committee_member_id: params.assigneeId,
  });
}

/** Dipanggil dari lib/budget/actions.ts setelah status disimpan "lengkap" -- dibungkus try/catch dengan alasan sama seperti checkAndNotifyInstanceComplete. */
export async function checkAndNotifyBudgetLengkap(
  supabase: SupabaseClient,
  kepanitiaanSiteId: string,
) {
  try {
    await notifyBudgetLengkap(supabase, kepanitiaanSiteId);
  } catch (err) {
    console.error("Gagal memeriksa/mengirim notifikasi budget lengkap:", err);
  }
}

/**
 * Dipanggil dari lib/tasks/actions.ts setelah update/hapus task/subtask.
 * Dibungkus try/catch di sini (bukan di tiap pemanggil) supaya kegagalan
 * cek/kirim notifikasi TIDAK PERNAH menggagalkan aksi simpan tugas yang
 * sebenarnya diminta pengguna -- ini murni efek samping, bukan bagian dari
 * hasil yang pengguna tunggu.
 */
export async function checkAndNotifyInstanceComplete(
  supabase: SupabaseClient,
  kepanitiaanSiteId: string,
) {
  try {
    if (await isInstanceFullyComplete(supabase, kepanitiaanSiteId)) {
      await notifyInstanceSelesai(supabase, kepanitiaanSiteId);
    }
  } catch (err) {
    console.error("Gagal memeriksa/mengirim notifikasi instance selesai:", err);
  }
}

/** Wrapper try/catch, alasan sama seperti checkAndNotifyInstanceComplete. */
export async function checkAndNotifyTaskAssigned(
  supabase: SupabaseClient,
  params: {
    assigneeId: string;
    refType: "task" | "subtask";
    refId: string;
    judul: string;
    deadline: string | null;
  },
) {
  try {
    await notifyTaskAssigned(supabase, params);
  } catch (err) {
    console.error("Gagal memeriksa/mengirim notifikasi tugas baru:", err);
  }
}
