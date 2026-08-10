import { LogoutButton } from "@/components/logout-button";
import { PageNav } from "@/components/page-nav";
import { BucketListSection, type BucketSummary } from "@/components/buckets/bucket-list-section";
import { MasterProgress } from "@/components/buckets/master-progress";
import { loadBucketBoardData } from "@/lib/buckets/board-data";
import { createClient } from "@/lib/supabase/server";

export default async function BucketListPanitiaPage({
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

  const bucketRows = (buckets ?? []) as BucketSummary[];
  const board = await loadBucketBoardData(supabase, kepanitiaanSiteId, bucketRows);

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-2">
        <div>
          <PageNav homeHref="/panitia/dashboard" />
          <h1 className="mt-1 text-xl font-semibold">
            Bucket Tugas — {typedInstance?.kepanitiaan?.nama} @ {typedInstance?.site?.nama_site}
          </h1>
        </div>
        <LogoutButton />
      </div>
      <MasterProgress
        progress={board.masterProgress}
        totalBucket={bucketRows.length}
        bucketSelesai={board.bucketSelesai}
      />
      <BucketListSection
        kepanitiaanSiteId={kepanitiaanSiteId}
        buckets={bucketRows}
        tasksByBucket={board.tasksByBucket}
        progressByBucket={board.progressByBucket}
        memberNameById={board.memberNameById}
        basePath="/panitia/bucket"
        currentPath="/panitia/bucket"
        error={error}
      />
    </main>
  );
}
