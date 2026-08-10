import { notFound } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { PageNav } from "@/components/page-nav";
import {
  BucketTasksSection,
  type Task,
  type Subtask,
  type AssignableMember,
} from "@/components/tasks/bucket-tasks-section";
import { BudgetSubmissionSection } from "@/components/budget/budget-submission-section";
import { loadBudgetTemplate } from "@/lib/budget/template";
import { loadBudgetSubmission } from "@/lib/budget/submission";
import { createClient } from "@/lib/supabase/server";

export default async function BucketDetailPanitiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ bucketId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { bucketId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("kepanitiaan_site_id")
    .eq("id", authData.user.id)
    .single();

  const kepanitiaanSiteId = profile?.kepanitiaan_site_id as string | null | undefined;

  if (!kepanitiaanSiteId) {
    return (
      <main className="flex min-h-screen flex-col gap-4 p-8">
        <p className="text-muted-foreground">
          Akun ini belum terhubung ke instance kepanitiaan manapun. Hubungi leader.
        </p>
      </main>
    );
  }

  const { data: bucket } = await supabase
    .from("buckets")
    .select("id, nama_bidang, is_budgeting")
    .eq("id", bucketId)
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
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
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
    .order("created_at");

  const subtasksByTask: Record<string, Subtask[]> = {};
  for (const subtask of (subtasks ?? []) as Subtask[]) {
    (subtasksByTask[subtask.task_id] ??= []).push(subtask);
  }

  const currentPath = `/panitia/bucket/${bucketId}`;

  const [template, submission] = bucket.is_budgeting
    ? await Promise.all([
        loadBudgetTemplate(supabase),
        loadBudgetSubmission(supabase, kepanitiaanSiteId),
      ])
    : [null, null];

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <PageNav homeHref="/panitia/dashboard" />
          <h1 className="mt-1 text-xl font-semibold">
            {bucket.nama_bidang}
            {bucket.is_budgeting && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">(Budgeting)</span>
            )}
          </h1>
        </div>
        <LogoutButton />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {bucket.is_budgeting && submission && (
        <BudgetSubmissionSection
          kepanitiaanSiteId={kepanitiaanSiteId}
          submission={submission}
          template={template}
          currentPath={currentPath}
        />
      )}

      <BucketTasksSection
        bucketId={bucketId}
        tasks={(tasks ?? []) as Task[]}
        subtasksByTask={subtasksByTask}
        members={(members ?? []) as AssignableMember[]}
        currentPath={currentPath}
      />
    </main>
  );
}
