import type { createClient } from "@/lib/supabase/server";
import { resolveMatchedMemberIds } from "@/lib/committee/match-account";

export type NotificationJenis =
  | "reminder_deadline"
  | "task_assigned"
  | "task_unassigned"
  | "budget_lengkap"
  | "instance_selesai";

/** 3 jenis ini personal ke 1 assignee (recipient_committee_member_id terisi), beda dari budget_lengkap/instance_selesai yang broadcast 1 instance. */
const PERSONAL_JENIS = ["reminder_deadline", "task_assigned", "task_unassigned"];

export type NotificationItem = {
  id: string;
  jenis: NotificationJenis;
  instanceLabel: string;
  sentAt: string;
};

type NotificationRow = {
  id: string;
  jenis: string;
  sent_at: string;
  kepanitiaan_site: {
    kepanitiaan: { nama: string } | null;
    site: { nama_site: string } | null;
  } | null;
};

const SELECT_COLUMNS = "id, jenis, sent_at, kepanitiaan_site(kepanitiaan(nama), site:sites(nama_site))";

function mapRow(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    jenis: row.jenis as NotificationJenis,
    sentAt: row.sent_at,
    instanceLabel: `${row.kepanitiaan_site?.kepanitiaan?.nama ?? "Kepanitiaan"} @ ${
      row.kepanitiaan_site?.site?.nama_site ?? "Site tidak diketahui"
    }`,
  };
}

/**
 * Riwayat notifikasi yang SUDAH dikirim ke leader lewat email -- ditampilkan
 * juga di dalam app supaya leader tidak wajib buka inbox untuk tahu ada
 * notifikasi baru. SENGAJA cuma "budget_lengkap"/"instance_selesai" --
 * "reminder_deadline"/"task_assigned" itu personal ke 1 panitia tertentu
 * (assignee-nya), bukan hal yang relevan ditampilkan generik ke leader.
 * `is_leader()` (RLS `notifications_log_scoped`, Fase 1) otomatis
 * mengizinkan baris lintas SEMUA instance terbaca di sini.
 */
export async function loadLeaderNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  limit = 20,
): Promise<NotificationItem[]> {
  const { data } = await supabase
    .from("notifications_log")
    .select(SELECT_COLUMNS)
    .in("jenis", ["budget_lengkap", "instance_selesai"])
    .order("sent_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as NotificationRow[]).map(mapRow);
}

/**
 * Versi panitia -- 2 kelompok yang digabung:
 * 1. Broadcast instance ("budget_lengkap"/"instance_selesai") -- RLS
 *    `notifications_log_scoped` sudah otomatis membatasi panitia cuma bisa
 *    baca baris instance-nya sendiri, jadi tidak perlu filter tambahan.
 * 2. Personal ("reminder_deadline"/"task_assigned"/"task_unassigned") -- HARUS difilter ke
 *    `recipient_committee_member_id` milik akun ini sendiri (dicocokkan
 *    lewat email, pola sama seperti "Tugas Saya" Fase 4), supaya panitia
 *    tidak melihat reminder/assignment milik rekan setimnya sendiri.
 * Digabung & di-sort ulang di JS (bukan `.or()` PostgREST) supaya lebih
 * mudah dibaca -- skala datanya kecil (1 instance), jadi tidak masalah.
 */
export async function loadPanitiaNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kepanitiaanSiteId: string,
  email: string | null | undefined,
  limit = 20,
): Promise<NotificationItem[]> {
  const matchedMemberIds = await resolveMatchedMemberIds(supabase, kepanitiaanSiteId, email);

  const [{ data: broadcastRows }, personalResult] = await Promise.all([
    supabase
      .from("notifications_log")
      .select(SELECT_COLUMNS)
      .eq("kepanitiaan_site_id", kepanitiaanSiteId)
      .in("jenis", ["budget_lengkap", "instance_selesai"])
      .order("sent_at", { ascending: false })
      .limit(limit),
    matchedMemberIds.length
      ? supabase
          .from("notifications_log")
          .select(SELECT_COLUMNS)
          .in("jenis", PERSONAL_JENIS)
          .in("recipient_committee_member_id", matchedMemberIds)
          .order("sent_at", { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as NotificationRow[] }),
  ]);

  const rows = [
    ...((broadcastRows ?? []) as unknown as NotificationRow[]),
    ...((personalResult.data ?? []) as unknown as NotificationRow[]),
  ];

  return rows
    .map(mapRow)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .slice(0, limit);
}
