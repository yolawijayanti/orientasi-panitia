import type { createClient } from "@/lib/supabase/server";
import type { ItemStatus } from "@/lib/tasks/actions";
import { computeProgress } from "@/lib/tasks/progress";

/**
 * "Selesai 100%" satu instance = union semua task+subtask di semua bucket
 * instance itu (sama persis definisi yang sudah dipakai MasterProgress
 * Fase 4 dan loadInstanceOverview Fase 6) -- instance yang belum punya
 * tugas sama sekali (0/0) TIDAK dihitung selesai, konsisten dengan
 * keputusan yang sama di kedua fase itu.
 */
export async function isInstanceFullyComplete(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kepanitiaanSiteId: string,
): Promise<boolean> {
  const { data: buckets } = await supabase
    .from("buckets")
    .select("id")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId);

  const bucketIds = (buckets ?? []).map((bucket) => bucket.id as string);
  if (bucketIds.length === 0) return false;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, status")
    .in("bucket_id", bucketIds);

  const taskRows = (tasks ?? []) as { id: string; status: ItemStatus }[];
  const taskIds = taskRows.map((task) => task.id);

  const { data: subtasks } = taskIds.length
    ? await supabase.from("subtasks").select("status").in("task_id", taskIds)
    : { data: [] };

  const subtaskRows = (subtasks ?? []) as { status: ItemStatus }[];

  const progress = computeProgress([
    ...taskRows.map((task) => task.status),
    ...subtaskRows.map((subtask) => subtask.status),
  ]);

  return progress.total > 0 && progress.done === progress.total;
}
