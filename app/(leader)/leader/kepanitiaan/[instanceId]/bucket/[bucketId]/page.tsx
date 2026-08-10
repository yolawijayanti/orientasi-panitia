import { notFound } from "next/navigation";

import { PageNav } from "@/components/page-nav";
import {
  BucketTasksSection,
  type Task,
  type Subtask,
  type AssignableMember,
} from "@/components/tasks/bucket-tasks-section";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderBucketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ instanceId: string; bucketId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { instanceId, bucketId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: bucket } = await supabase
    .from("buckets")
    .select("id, nama_bidang, is_budgeting")
    .eq("id", bucketId)
    .eq("kepanitiaan_site_id", instanceId)
    .single();

  if (!bucket) notFound();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, judul, deadline, status, assignee_id")
    .eq("bucket_id", bucketId)
    .order("created_at");

  const taskIds = (tasks ?? []).map((task) => task.id);

  const { data: subtasks } = taskIds.length
    ? await supabase
        .from("subtasks")
        .select("id, task_id, judul, deadline, status, assignee_id")
        .in("task_id", taskIds)
        .order("created_at")
    : { data: [] as Subtask[] };

  const { data: members } = await supabase
    .from("committee_members")
    .select("id, nama, role")
    .eq("kepanitiaan_site_id", instanceId)
    .order("created_at");

  const subtasksByTask: Record<string, Subtask[]> = {};
  for (const subtask of (subtasks ?? []) as Subtask[]) {
    (subtasksByTask[subtask.task_id] ??= []).push(subtask);
  }

  const currentPath = `/leader/kepanitiaan/${instanceId}/bucket/${bucketId}`;

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div>
        <PageNav homeHref="/leader/dashboard" />
        <h1 className="mt-1 text-xl font-semibold">
          {bucket.nama_bidang}
          {bucket.is_budgeting && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">(Budgeting)</span>
          )}
        </h1>
      </div>

      <BucketTasksSection
        bucketId={bucketId}
        tasks={(tasks ?? []) as Task[]}
        subtasksByTask={subtasksByTask}
        members={(members ?? []) as AssignableMember[]}
        currentPath={currentPath}
        error={error}
      />
    </main>
  );
}
