import type { createClient } from "@/lib/supabase/server";

export type CandidateAccount = { id: string; email: string };

/**
 * Akun panitia yang sudah terdaftar (public.users, role='panitia') untuk
 * satu instance -- ini yang boleh ditambahkan ke Susunan Panitia lewat
 * AddMemberRow. Lewat RPC `list_akun_panitia_instance` (migration
 * 20260810000008) karena RLS `users_select_own_or_leader` biasa cuma
 * mengizinkan akun panitia lihat baris sendiri, tidak lihat peer di
 * instance yang sama.
 */
export async function loadCandidateAccounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kepanitiaanSiteId: string,
): Promise<CandidateAccount[]> {
  const { data } = await supabase.rpc("list_akun_panitia_instance", {
    p_kepanitiaan_site_id: kepanitiaanSiteId,
  });

  return (data ?? []) as CandidateAccount[];
}
