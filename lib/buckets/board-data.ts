import { computeBucketProgressMap, computeProgress, type Progress } from "@/lib/tasks/progress";
import type { ItemStatus } from "@/lib/tasks/actions";
import type { BoardTask } from "@/components/buckets/bucket-board";
import type { createClient } from "@/lib/supabase/server";

type BucketRow = { id: string; nama_bidang: string; is_budgeting: boolean };

/**
 * Ambil semua data yang dibutuhkan board bucket + master progres satu
 * instance, dipakai bareng oleh halaman leader (detail instance) dan panitia
 * (/panitia/bucket) supaya keduanya tidak menghitung progres dengan cara
 * yang berbeda. Query-nya datar (3x `in (...)`), bukan per-bucket, supaya
 * tidak N+1.
 */
export async function loadBucketBoardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kepanitiaanSiteId: string,
  buckets: BucketRow[],
) {
  const bucketIds = buckets.map((bucket) => bucket.id);

  const { data: tasks } = bucketIds.length
    ? await supabase
        .from("tasks")
        .select("id, bucket_id, judul, deadline, status, assignee_id")
        .in("bucket_id", bucketIds)
        .order("created_at")
    : { data: [] };

  const taskRows = (tasks ?? []) as {
    id: string;
    bucket_id: string;
    judul: string;
    deadline: string | null;
    status: ItemStatus;
    assignee_id: string | null;
  }[];

  const taskIds = taskRows.map((task) => task.id);

  const { data: subtasks } = taskIds.length
    ? await supabase.from("subtasks").select("task_id, status").in("task_id", taskIds)
    : { data: [] };

  const subtaskRows = (subtasks ?? []) as { task_id: string; status: ItemStatus }[];

  const { data: members } = await supabase
    .from("committee_members")
    .select("id, nama")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId);

  const memberNameById: Record<string, string> = {};
  for (const member of (members ?? []) as { id: string; nama: string }[]) {
    memberNameById[member.id] = member.nama;
  }

  const subtaskStatsByTask: Record<string, { total: number; done: number }> = {};
  for (const subtask of subtaskRows) {
    const stats = (subtaskStatsByTask[subtask.task_id] ??= { total: 0, done: 0 });
    stats.total += 1;
    if (subtask.status === "selesai") stats.done += 1;
  }

  const tasksByBucket: Record<string, BoardTask[]> = {};
  for (const task of taskRows) {
    const stats = subtaskStatsByTask[task.id] ?? { total: 0, done: 0 };
    (tasksByBucket[task.bucket_id] ??= []).push({
      id: task.id,
      bucket_id: task.bucket_id,
      judul: task.judul,
      deadline: task.deadline,
      status: task.status,
      assignee_id: task.assignee_id,
      subtaskTotal: stats.total,
      subtaskDone: stats.done,
    });
  }

  const progressByBucket = computeBucketProgressMap(taskRows, subtaskRows);

  const masterProgress: Progress = computeProgress([
    ...taskRows.map((task) => task.status),
    ...subtaskRows.map((subtask) => subtask.status),
  ]);

  // Bucket kosong (belum ada tugas sama sekali) tidak dihitung "selesai" --
  // 0/0 itu belum dikerjakan, bukan sudah beres.
  const bucketSelesai = buckets.filter((bucket) => {
    const progress = progressByBucket[bucket.id];
    return progress && progress.total > 0 && progress.done === progress.total;
  }).length;

  return { tasksByBucket, progressByBucket, memberNameById, masterProgress, bucketSelesai };
}
