import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: "leader" | "panitia" | null;
  kepanitiaanSiteId: string | null;
};

/**
 * `React.cache()` -- dalam SATU request, siapapun yang panggil ini (layout
 * lonceng notifikasi, halaman, komponen manapun) dapat hasil yang SAMA
 * tanpa network round-trip baru ke Supabase Auth + tabel `users`. Sebelum
 * ada ini, tiap halaman leader/panitia dan lonceng notifikasi masing-masing
 * panggil `auth.getUser()` + query profile SENDIRI-SENDIRI, jadi tiap
 * navigasi bayar beberapa round-trip yang sebenarnya redundant. Ini bagian
 * dari perbaikan performa navigasi (lihat HANDOVER.md Catatan Teknis
 * Fase 7 Revisi 6).
 *
 * `proxy.ts` (middleware) TETAP panggil `auth.getUser()` sendiri -- itu
 * jalan di execution context terpisah SEBELUM React render dimulai,
 * `React.cache()` tidak bisa menjangkau ke sana. Ini cuma dedupe
 * panggilan-panggilan DI DALAM satu render (layout + page + komponen).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role, kepanitiaan_site_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  return {
    id: authData.user.id,
    email: authData.user.email ?? null,
    role: (profile?.role as CurrentUser["role"]) ?? null,
    kepanitiaanSiteId: profile?.kepanitiaan_site_id ?? null,
  };
});
