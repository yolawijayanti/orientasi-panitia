import type { createClient } from "@/lib/supabase/server";
import { resolveMatchedMemberIds } from "@/lib/committee/match-account";

export type NotificationJenis =
  | "reminder_deadline"
  | "task_assigned"
  | "task_unassigned"
  | "budget_lengkap"
  | "instance_selesai";

/** 3 jenis ini personal ke 1 assignee (recipient_committee_member_id terisi), beda dari budget_lengkap/instance_selesai yang broadcast 1 instance. */
const PERSONAL_JENIS: NotificationJenis[] = ["reminder_deadline", "task_assigned", "task_unassigned"];

export type NotificationItem = {
  id: string;
  jenis: NotificationJenis;
  instanceLabel: string;
  sentAt: string;
  /** Tujuan klik -- null kalau tidak ada halaman yang relevan (jarang, cuma kalau task/subtask sumbernya sudah terhapus). */
  href: string | null;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type NotificationRow = {
  id: string;
  jenis: string;
  sent_at: string;
  kepanitiaan_site_id: string;
  ref_type: string | null;
  ref_id: string | null;
  kepanitiaan_site: {
    kepanitiaan: { nama: string } | null;
    site: { nama_site: string } | null;
  } | null;
};

const SELECT_COLUMNS =
  "id, jenis, sent_at, kepanitiaan_site_id, ref_type, ref_id, kepanitiaan_site(kepanitiaan(nama), site:sites(nama_site))";

type MappedRow = {
  id: string;
  jenis: NotificationJenis;
  sentAt: string;
  instanceLabel: string;
  kepanitiaanSiteId: string;
  refType: string | null;
  refId: string | null;
};

function mapRow(row: NotificationRow): MappedRow {
  return {
    id: row.id,
    jenis: row.jenis as NotificationJenis,
    sentAt: row.sent_at,
    kepanitiaanSiteId: row.kepanitiaan_site_id,
    refType: row.ref_type,
    refId: row.ref_id,
    instanceLabel: `${row.kepanitiaan_site?.kepanitiaan?.nama ?? "Kepanitiaan"} @ ${
      row.kepanitiaan_site?.site?.nama_site ?? "Site tidak diketahui"
    }`,
  };
}

/**
 * Resolve `bucket_id` untuk sekumpulan referensi task/subtask sekaligus
 * (bukan per-row, supaya tidak N+1) -- dipakai untuk membangun link
 * "klik notifikasi -> ke tugasnya" di feed panitia. Key Map-nya
 * `${refType}:${refId}` (bukan cuma refId) supaya aman kalaupun task id
 * dan subtask id kebetulan sama (praktiknya mustahil, UUID, tapi tidak
 * mengandalkan itu).
 */
async function resolveBucketIdsForRefs(
  supabase: SupabaseClient,
  refs: { refType: string; refId: string }[],
): Promise<Map<string, string>> {
  const taskIds = refs.filter((ref) => ref.refType === "task").map((ref) => ref.refId);
  const subtaskIds = refs.filter((ref) => ref.refType === "subtask").map((ref) => ref.refId);

  const bucketByKey = new Map<string, string>();

  if (taskIds.length) {
    const { data } = await supabase.from("tasks").select("id, bucket_id").in("id", taskIds);
    for (const task of (data ?? []) as { id: string; bucket_id: string }[]) {
      bucketByKey.set(`task:${task.id}`, task.bucket_id);
    }
  }

  if (subtaskIds.length) {
    // Flat 2-langkah (subtasks -> task_id, lalu tasks -> bucket_id), BUKAN
    // nested embed PostgREST (`task:tasks(bucket_id)`) -- pola yang sama
    // dipakai di app/api/cron/reminders/route.ts untuk resolve bucket
    // subtask. Sebelumnya pakai embed, tapi errornya di-swallow diam-diam
    // (cuma destructure `data`) kalau embed-nya gagal -- jadi kalau
    // notifikasi personal panitia mengarah ke subtask, link-nya senyap jadi
    // null (dilaporkan Yolanda: notifikasi tidak clickable di halaman
    // panitia). Query flat begini tidak bergantung pada embed sama sekali.
    const { data: subtaskRows } = await supabase
      .from("subtasks")
      .select("id, task_id")
      .in("id", subtaskIds);

    const parentTaskIds = [...new Set((subtaskRows ?? []).map((row) => row.task_id))];
    const { data: parentTasks } = parentTaskIds.length
      ? await supabase.from("tasks").select("id, bucket_id").in("id", parentTaskIds)
      : { data: [] as { id: string; bucket_id: string }[] };
    const bucketIdByTaskId = new Map(
      (parentTasks ?? []).map((task) => [task.id, task.bucket_id]),
    );

    for (const subtask of (subtaskRows ?? []) as { id: string; task_id: string }[]) {
      const bucketId = bucketIdByTaskId.get(subtask.task_id);
      if (bucketId) bucketByKey.set(`subtask:${subtask.id}`, bucketId);
    }
  }

  return bucketByKey;
}

/**
 * Riwayat notifikasi yang SUDAH dikirim ke leader lewat email -- ditampilkan
 * juga di dalam app supaya leader tidak wajib buka inbox untuk tahu ada
 * notifikasi baru. SENGAJA cuma "budget_lengkap"/"instance_selesai" --
 * "reminder_deadline"/"task_assigned"/"task_unassigned" itu personal ke 1
 * panitia tertentu (assignee-nya), bukan hal yang relevan ditampilkan
 * generik ke leader. `is_leader()` (RLS `notifications_log_scoped`, Fase 1)
 * otomatis mengizinkan baris lintas SEMUA instance terbaca di sini.
 * Klik notifikasi -> ke halaman detail instance-nya (leader tidak punya
 * konteks "tugas" per notifikasi, cuma budget_lengkap/instance_selesai
 * yang sifatnya level instance).
 */
export async function loadLeaderNotifications(
  supabase: SupabaseClient,
  limit = 20,
): Promise<NotificationItem[]> {
  const { data } = await supabase
    .from("notifications_log")
    .select(SELECT_COLUMNS)
    .in("jenis", ["budget_lengkap", "instance_selesai"])
    .order("sent_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as NotificationRow[]).map(mapRow).map((item) => ({
    id: item.id,
    jenis: item.jenis,
    sentAt: item.sentAt,
    instanceLabel: item.instanceLabel,
    href: `/leader/kepanitiaan/${item.kepanitiaanSiteId}`,
  }));
}

/**
 * Versi panitia -- 2 kelompok yang digabung:
 * 1. Broadcast instance ("budget_lengkap"/"instance_selesai") -- RLS
 *    `notifications_log_scoped` sudah otomatis membatasi panitia cuma bisa
 *    baca baris instance-nya sendiri, jadi tidak perlu filter tambahan.
 *    Klik -> `/panitia/workspace` (tab "Submit Budget" ada di situ, tapi
 *    SideTabs belum deep-link ke tab tertentu lewat URL -- klik notifikasi
 *    ini mendarat di tab pertama, bukan langsung tab Submit Budget).
 * 2. Personal ("reminder_deadline"/"task_assigned"/"task_unassigned") -- HARUS difilter ke
 *    `recipient_committee_member_id` milik akun ini sendiri (dicocokkan
 *    lewat email, pola sama seperti "Tugas Saya" Fase 4), supaya panitia
 *    tidak melihat reminder/assignment milik rekan setimnya sendiri. Klik
 *    -> `/panitia/bucket/[bucketId]` tempat tugas/subtugas itu berada
 *    (resolve lewat resolveBucketIdsForRefs, batch bukan per-row).
 * Digabung & di-sort ulang di JS (bukan `.or()` PostgREST) supaya lebih
 * mudah dibaca -- skala datanya kecil (1 instance), jadi tidak masalah.
 */
export async function loadPanitiaNotifications(
  supabase: SupabaseClient,
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

  const combined = [
    ...((broadcastRows ?? []) as unknown as NotificationRow[]),
    ...((personalResult.data ?? []) as unknown as NotificationRow[]),
  ]
    .map(mapRow)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .slice(0, limit);

  const personalRefs = combined
    .filter((item) => PERSONAL_JENIS.includes(item.jenis) && item.refType && item.refId)
    .map((item) => ({ refType: item.refType!, refId: item.refId! }));

  const bucketByKey = await resolveBucketIdsForRefs(supabase, personalRefs);

  return combined.map((item) => {
    let href: string | null = null;
    if (PERSONAL_JENIS.includes(item.jenis)) {
      const bucketId = item.refType && item.refId ? bucketByKey.get(`${item.refType}:${item.refId}`) : undefined;
      href = bucketId ? `/panitia/bucket/${bucketId}` : null;
    } else {
      href = "/panitia/workspace";
    }
    return {
      id: item.id,
      jenis: item.jenis,
      sentAt: item.sentAt,
      instanceLabel: item.instanceLabel,
      href,
    };
  });
}
