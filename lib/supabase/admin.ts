import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client khusus context TANPA sesi login (cron reminder) -- pakai
 * SUPABASE_SERVICE_ROLE_KEY yang bypass RLS sepenuhnya, karena cron perlu
 * baca task/subtask jatuh tempo LINTAS SEMUA instance sekaligus, bukan
 * cuma instance satu akun. Beda dari lib/supabase/client.ts (browser, anon
 * key, RLS aktif) dan lib/supabase/server.ts (Server Component/Action,
 * anon key + cookie sesi, RLS aktif sesuai akun yang login) -- client ini
 * SENGAJA tidak dipakai di luar route cron, karena kalau dipakai di
 * halaman/action biasa akan menghilangkan seluruh proteksi RLS.
 *
 * SUPABASE_SERVICE_ROLE_KEY adalah kredensial rahasia (bukan
 * NEXT_PUBLIC_*) -- jangan pernah dikirim ke browser. Ambil dari Supabase
 * Dashboard > Project Settings > API > service_role secret, isi di env
 * Vercel (dan `.env.local` kalau perlu tes cron ini di sandbox/lokal).
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi di environment.");
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
