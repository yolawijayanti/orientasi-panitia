import type { createClient } from "@/lib/supabase/server";

/**
 * Cocokkan akun login (lewat email) ke baris `committee_members` di satu
 * instance -- dipakai "Tugas Saya" (Fase 4) dan feed notifikasi personal
 * panitia (Fase 7 revisi 3). Skema tidak punya kolom yang menautkan
 * `committee_members` ke `auth.users`/`public.users`, jadi email dipakai
 * sebagai kunci pencocokan (case-insensitive) -- lihat lib/tasks/my-tasks.ts
 * untuk detail konsekuensinya (leader harus isi committee_members.email
 * SAMA PERSIS dengan email login panitia).
 */
export async function resolveMatchedMemberIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kepanitiaanSiteId: string,
  email: string | null | undefined,
): Promise<string[]> {
  if (!email) return [];

  const { data } = await supabase
    .from("committee_members")
    .select("id")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
    .ilike("email", email);

  return (data ?? []).map((member) => member.id as string);
}
