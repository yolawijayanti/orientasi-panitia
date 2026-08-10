import type { ItemStatus } from "@/lib/tasks/actions";

export type Progress = { total: number; done: number; percent: number };

/** Progress "sederhana": tugas + subtugas dihitung flat, tidak berjenjang -- satu subtugas selesai bobotnya sama dengan satu tugas tanpa subtugas selesai. */
export function computeProgress(statuses: ItemStatus[]): Progress {
  const total = statuses.length;
  const done = statuses.filter((status) => status === "selesai").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

/** Dipakai di halaman daftar bucket, yang butuh progress tiap bucket sekaligus tanpa query per-bucket. */
export function computeBucketProgressMap(
  tasks: { id: string; bucket_id: string; status: ItemStatus }[],
  subtasks: { task_id: string; status: ItemStatus }[],
): Record<string, Progress> {
  const statusesByBucket: Record<string, ItemStatus[]> = {};
  const bucketIdByTaskId: Record<string, string> = {};

  for (const task of tasks) {
    bucketIdByTaskId[task.id] = task.bucket_id;
    (statusesByBucket[task.bucket_id] ??= []).push(task.status);
  }

  for (const subtask of subtasks) {
    const bucketId = bucketIdByTaskId[subtask.task_id];
    if (!bucketId) continue;
    (statusesByBucket[bucketId] ??= []).push(subtask.status);
  }

  const result: Record<string, Progress> = {};
  for (const [bucketId, statuses] of Object.entries(statusesByBucket)) {
    result[bucketId] = computeProgress(statuses);
  }
  return result;
}
