import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommitteeMembersSection, type CommitteeMember } from "@/components/committee/committee-members-section";
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
    .select("id, nama, email, role")
    .eq("kepanitiaan_site_id", instanceId)
    .order("created_at");

  const currentPath = `/leader/kepanitiaan/${instanceId}`;

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div>
        <Link href="/leader/kepanitiaan" className="text-sm text-muted-foreground hover:underline">
          ← Kembali ke daftar kepanitiaan
        </Link>
        <h1 className="text-xl font-semibold">
          {typedInstance.kepanitiaan?.nama} @ {typedInstance.site?.nama_site}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bucket Kepanitiaan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(buckets ?? []).map((bucket) => (
            <span key={bucket.id} className="rounded-full border px-3 py-1 text-sm">
              {bucket.nama_bidang}
              {bucket.is_budgeting && (
                <span className="ml-1 text-xs text-muted-foreground">(budgeting)</span>
              )}
            </span>
          ))}
        </CardContent>
      </Card>

      <CommitteeMembersSection
        kepanitiaanSiteId={instanceId}
        members={(members ?? []) as CommitteeMember[]}
        currentPath={currentPath}
        error={error}
      />
    </main>
  );
}
