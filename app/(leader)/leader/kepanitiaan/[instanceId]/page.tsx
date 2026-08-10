import { notFound } from "next/navigation";

import { PageNav } from "@/components/page-nav";
import { AccordionSection } from "@/components/ui/accordion-section";
import { CommitteeMembersSection, type CommitteeMember } from "@/components/committee/committee-members-section";
import { TimelineSection, type Milestone } from "@/components/timeline/timeline-section";
import { BucketListSection, type BucketSummary } from "@/components/buckets/bucket-list-section";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteInstance } from "@/lib/kepanitiaan/actions";
import { loadBucketBoardData } from "@/lib/buckets/board-data";
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

  const bucketRows = (buckets ?? []) as BucketSummary[];
  const board = await loadBucketBoardData(supabase, instanceId, bucketRows);

  const currentPath = `/leader/kepanitiaan/${instanceId}`;
  const namaInstance = `${typedInstance.kepanitiaan?.nama} @ ${typedInstance.site?.nama_site}`;
  const deleteAction = deleteInstance.bind(null, instanceId);

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div>
        <PageNav homeHref="/leader/dashboard" />
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
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

      <AccordionSection title="Progres Kepanitiaan & Task Board" defaultOpen>
        <BucketListSection
          kepanitiaanSiteId={instanceId}
          buckets={bucketRows}
          tasksByBucket={board.tasksByBucket}
          progressByBucket={board.progressByBucket}
          memberNameById={board.memberNameById}
          masterProgress={board.masterProgress}
          bucketSelesai={board.bucketSelesai}
          basePath={`/leader/kepanitiaan/${instanceId}/bucket`}
          currentPath={currentPath}
        />
      </AccordionSection>

      <AccordionSection title="Timeline Pelaksanaan">
        <TimelineSection
          kepanitiaanSiteId={instanceId}
          milestones={(milestones ?? []) as Milestone[]}
          currentPath={currentPath}
        />
      </AccordionSection>

      <AccordionSection title="Susunan Panitia">
        <CommitteeMembersSection
          kepanitiaanSiteId={instanceId}
          members={(members ?? []) as CommitteeMember[]}
          buckets={(buckets ?? []).map(({ id, nama_bidang }) => ({ id, nama_bidang }))}
          currentPath={currentPath}
        />
      </AccordionSection>

    </main>
  );
}
