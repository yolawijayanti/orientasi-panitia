import type { createClient } from "@/lib/supabase/server";

export type LeaderNotificationJenis = "budget_lengkap" | "instance_selesai";

export type LeaderNotification = {
  id: string;
  jenis: LeaderNotificationJenis;
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

/**
 * Riwayat notifikasi yang SUDAH dikirim ke leader lewat email -- ditampilkan
 * juga di dalam app (fitur tambahan setelah verifikasi live cron/email
 * Fase 7) supaya leader tidak wajib buka inbox untuk tahu ada notifikasi
 * baru. SENGAJA tidak menyertakan jenis "reminder_deadline" -- itu dikirim
 * ke PANITIA (assignee tugas), bukan ke leader, jadi tidak relevan
 * ditampilkan di feed milik leader ini.
 */
export async function loadLeaderNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  limit = 20,
): Promise<LeaderNotification[]> {
  const { data } = await supabase
    .from("notifications_log")
    .select("id, jenis, sent_at, kepanitiaan_site(kepanitiaan(nama), site:sites(nama_site))")
    .in("jenis", ["budget_lengkap", "instance_selesai"])
    .order("sent_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as unknown as NotificationRow[];

  return rows.map((row) => ({
    id: row.id,
    jenis: row.jenis as LeaderNotificationJenis,
    sentAt: row.sent_at,
    instanceLabel: `${row.kepanitiaan_site?.kepanitiaan?.nama ?? "Kepanitiaan"} @ ${
      row.kepanitiaan_site?.site?.nama_site ?? "Site tidak diketahui"
    }`,
  }));
}
