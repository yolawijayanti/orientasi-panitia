import Link from "next/link";
import { notFound } from "next/navigation";

import { CommitteeMembersSection, type CommitteeMember } from "@/components/committee/committee-members-section";
import { TimelineSection, type Milestone } from "@/components/timeline/timeline-section";
import { BucketListSection, type BucketSummary } from "@/components/buckets/bucket-list-section";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteInstance } from "@/lib/kepanitiaan/actions";
import { computeBucketProgressMap } from "@/lib/tasks/progress";
import type { ItemStatus } from "@/lib/tasks/actions";
import { createClient } from "@/lib/supabase/server";

export default async function InstanceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ instanceId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { instanceId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: instance } = await supabase
    .from("kepanitiaan_site")
    .select("id, kepanitiaan(nama), site:sites(nama_site)")
    .eq("id", instanceId)
    .single();

  if (!instance) notFound();

  const typedInstance = instance as unknown as {
    kepanitiaan: { nama: string } | null;
    site: { nama_site: string } | null;
  };

  const { data: buckets } = await supabase
    .from("buckets")
    .select("id, nama_bidang, is_budgeting")
    .eq("kepanitiaan_site_id", instanceId)
    .order("created_at");

  const { data: members } = await supabase
    .from("committee_members")
    .select("id, nama, email, role, bucket_id")
    .eq("kepanitiaan_site_id", instanceId)
    .order("created_at");

  const { data: milestones } = await supabase
    .from("timeline_milestones")
    .select("id, nama_milestone, tanggal_mulai, tanggal_selesai")
    .eq("kepanitiaan_site_id", instanceId)
    .order("tanggal_mulai");

  const bucketIds = (buckets ?? []).map((bucket) => bucket.id);

  const { data: tasksForProgress } = bucketIds.length
    ? await supabase.from("tasks").select("id, bucket_id, status").in("bucket_id", bucketIds)
    : { data: [] as { id: string; bucket_id: string; status: ItemStatus }[] };

  const taskIds = (tasksForProgress ?? []).map((task) => task.id);

  const { data: subtasksForProgress } = taskIds.length
    ? await supabase.from("subtasks").select("task_id, status").in("task_id", taskIds)
    : { data: [] as { task_id: string; status: ItemStatus }[] };

  const progressByBucket = computeBucketProgressMap(
    (tasksForProgress ?? []) as { id: string; bucket_id: string; status: ItemStatus }[],
    (subtasksForProgress ?? []) as { task_id: string; status: ItemStatus }[],
  );

  const currentPath = `/leader/kepanitiaan/${instanceId}`;
  const namaInstance = `${typedInstance.kepanitiaan?.nama} @ ${typedInstance.site?.nama_site}`;
  const deleteAction = deleteInstance.bind(null, instanceId);

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div>
        <Link href="/leader/kepanitiaan" className="text-sm text-muted-foreground hover:underline">
          ← Kembali ke daftar kepanitiaan
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">{namaInstance}</h1>
          <form action={deleteAction}>
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              confirmMessage={`Hapus instance "${namaInstance}"? Susunan panitia, bucket, dan tugas di instance ini ikut terhapus permanen. Instance site lain di kepanitiaan yang sama tidak terpengaruh.`}
            >
              Hapus Instance Ini
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <BucketListSection
        kepanitiaanSiteId={instanceId}
        buckets={(buckets ?? []) as BucketSummary[]}
        progressByBucket={progressByBucket}
        basePath={`/leader/kepanitiaan/${instanceId}/bucket`}
        currentPath={currentPath}
      />

      <TimelineSection
        kepanitiaanSiteId={instanceId}
        milestones={(milestones ?? []) as Milestone[]}
        currentPath={currentPath}
      />

      {/* error sudah ditampilkan di header halaman ini, jadi tidak dioper lagi
          ke section supaya tidak muncul dobel. */}
      <CommitteeMembersSection
        kepanitiaanSiteId={instanceId}
        members={(members ?? []) as CommitteeMember[]}
        buckets={(buckets ?? []).map(({ id, nama_bidang }) => ({ id, nama_bidang }))}
        currentPath={currentPath}
      />
    </main>
  );
}
