import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Dibungkus `React.cache()` (Request Memoization resmi Next.js, lihat
 * `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
 * bagian "Reusing data with React.cache") -- di dalam SATU request/render
 * yang sama, halaman/layout/komponen manapun yang panggil `createClient()`
 * lebih dari sekali dapat INSTANCE YANG SAMA, bukan bikin client baru +
 * parse cookies ulang tiap kali. Ini mengurangi kerja berulang setiap
 * navigasi -- misal layout (lonceng notifikasi) dan halaman itu sendiri
 * sama-sama butuh Supabase client, sebelumnya masing-masing bikin
 * instance sendiri secara independen.
 */
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll dipanggil dari Server Component; aman diabaikan karena
            // middleware yang menangani refresh session di request berikutnya.
          }
        },
      },
    },
  );
});
