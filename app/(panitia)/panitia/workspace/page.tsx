import { LogoutButton } from "@/components/logout-button";
import { PageNav } from "@/components/page-nav";
import { SideTabs } from "@/components/ui/side-tabs";
import { BucketListSection, type BucketSummary } from "@/components/buckets/bucket-list-section";
import { TimelineSection, type Milestone } from "@/components/timeline/timeline-section";
import {
  CommitteeMembersSection,
  type CommitteeMember,
} from "@/components/committee/committee-members-section";
import { MyTasksSection } from "@/components/tasks/my-tasks-section";
import { loadBucketBoardData } from "@/lib/buckets/board-data";
import { loadMyTasks } from "@/lib/tasks/my-tasks";
import { createClient } from "@/lib/supabase/server";

const CURRENT_PATH = "/panitia/workspace";

export default async function PanitiaWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
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

  const { data: instance } = await supabase
    .from("kepanitiaan_site")
    .select("kepanitiaan(nama), site:sites(nama_site)")
    .eq("id", kepanitiaanSiteId)
    .single();

  const typedInstance = instance as unknown as {
    kepanitiaan: { nama: string } | null;
    site: { nama_site: string } | null;
  } | null;

  const { data: buckets } = await supabase
    .from("buckets")
    .select("id, nama_bidang, is_budgeting")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
    .order("created_at");

  const { data: members } = await supabase
    .from("committee_members")
    .select("id, nama, email, role, bucket_id")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
    .order("created_at");

  const { data: milestones } = await supabase
    .from("timeline_milestones")
    .select("id, nama_milestone, tanggal_mulai, tanggal_selesai")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
    .order("tanggal_mulai");

  const bucketRows = (buckets ?? []) as BucketSummary[];
  const board = await loadBucketBoardData(supabase, kepanitiaanSiteId, bucketRows);
  const myTasks = await loadMyTasks(supabase, kepanitiaanSiteId, authData.user.email);

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-2">
        <div>
          <PageNav homeHref="/panitia/dashboard" />
          <h1 className="mt-1 text-xl font-semibold">
            {typedInstance?.kepanitiaan?.nama} @ {typedInstance?.site?.nama_site}
          </h1>
        </div>
        <LogoutButton />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <SideTabs
        tabs={[
          {
            id: "progres",
            label: "Progres & Task Board",
            content: (
              <BucketListSection
                kepanitiaanSiteId={kepanitiaanSiteId}
                buckets={bucketRows}
                tasksByBucket={board.tasksByBucket}
                progressByBucket={board.progressByBucket}
                memberNameById={board.memberNameById}
                masterProgress={board.masterProgress}
                bucketSelesai={board.bucketSelesai}
                basePath="/panitia/bucket"
                currentPath={CURRENT_PATH}
              />
            ),
          },
          {
            id: "tugas-saya",
            label: "Tugas Saya",
            content: (
              <MyTasksSection matched={myTasks.matchedMemberIds.length > 0} tasks={myTasks.tasks} />
            ),
          },
          {
            id: "timeline",
            label: "Timeline Pelaksanaan",
            content: (
              <TimelineSection
                kepanitiaanSiteId={kepanitiaanSiteId}
                milestones={(milestones ?? []) as Milestone[]}
                currentPath={CURRENT_PATH}
              />
            ),
          },
          {
            id: "susunan",
            label: "Susunan Panitia",
            content: (
              <CommitteeMembersSection
                kepanitiaanSiteId={kepanitiaanSiteId}
                members={(members ?? []) as CommitteeMember[]}
                buckets={bucketRows.map(({ id, nama_bidang }) => ({ id, nama_bidang }))}
                currentPath={CURRENT_PATH}
              />
            ),
          },
        ]}
      />
    </main>
  );
}
