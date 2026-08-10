import type { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { budgetLengkapEmail, instanceSelesaiEmail } from "@/lib/notifications/templates";
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

  const [instanceLabel, leaderEmails] = await Promise.all([
    loadInstanceLabel(supabase, kepanitiaanSiteId),
    getLeaderEmails(supabase),
  ]);

  const { subject, html } = budgetLengkapEmail(instanceLabel);
  await sendEmail(leaderEmails, subject, html);

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

  const [instanceLabel, leaderEmails] = await Promise.all([
    loadInstanceLabel(supabase, kepanitiaanSiteId),
    getLeaderEmails(supabase),
  ]);

  const { subject, html } = instanceSelesaiEmail(instanceLabel);
  await sendEmail(leaderEmails, subject, html);

  await supabase.from("notifications_log").insert({
    kepanitiaan_site_id: kepanitiaanSiteId,
    jenis: "instance_selesai",
    ref_type: "kepanitiaan_site",
    ref_id: kepanitiaanSiteId,
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
