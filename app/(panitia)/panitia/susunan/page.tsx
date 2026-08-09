import { LogoutButton } from "@/components/logout-button";
import { CommitteeMembersSection, type CommitteeMember } from "@/components/committee/committee-members-section";
import { createClient } from "@/lib/supabase/server";

export default async function SusunanPanitiaPage({
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

  const { data: members } = await supabase
    .from("committee_members")
    .select("id, nama, email, role")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
    .order("created_at");

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Susunan Panitia — {typedInstance?.kepanitiaan?.nama} @ {typedInstance?.site?.nama_site}
        </h1>
        <LogoutButton />
      </div>
      <CommitteeMembersSection
        kepanitiaanSiteId={kepanitiaanSiteId}
        members={(members ?? []) as CommitteeMember[]}
        currentPath="/panitia/susunan"
        error={error}
      />
    </main>
  );
}
