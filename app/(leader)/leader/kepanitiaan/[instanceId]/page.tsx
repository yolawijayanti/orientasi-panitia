import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommitteeMembersSection, type CommitteeMember } from "@/components/committee/committee-members-section";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteInstance } from "@/lib/kepanitiaan/actions";
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

      {/* error sudah ditampilkan di header halaman ini, jadi tidak dioper lagi
          ke section supaya tidak muncul dobel. */}
      <CommitteeMembersSection
        kepanitiaanSiteId={instanceId}
        members={(members ?? []) as CommitteeMember[]}
        currentPath={currentPath}
      />
    </main>
  );
}
