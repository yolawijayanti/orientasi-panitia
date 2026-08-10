-- Fase 4 (revisi ronde 4): batasi "+ Tambah Anggota" supaya cuma bisa
-- pilih akun panitia yang SUDAH terdaftar di public.users untuk instance
-- itu -- bukan lagi email bebas ketik. Ini supaya data committee_members
-- selalu sinkron dengan akun login sejak awal (bukan menyusul diperbaiki
-- kalau ada typo email), yang juga jadi syarat "Tugas Saya" (Fase 4 ronde
-- 3, cocok akun ke committee_members lewat email) bekerja tanpa drama.
--
-- Jalankan lewat Supabase Dashboard > SQL Editor setelah migration
-- 20260809000001 s/d 20260810000007.

-- =========================================================================
-- Kenapa perlu RPC baru, bukan query langsung ke public.users:
--
-- Policy "users_select_own_or_leader" dari Fase 1 cuma mengizinkan akun
-- lihat baris sendiri, ATAU semua baris kalau leader. Akun panitia TIDAK
-- bisa SELECT baris panitia lain lewat query biasa -- termasuk peer di
-- instance yang sama -- padahal fitur ini perlu panitia bisa melihat daftar
-- akun terdaftar di instance-nya sendiri supaya bisa menambah rekan
-- setimnya ke Susunan Panitia. Function ini security definer (pola sama
-- seperti current_user_role()/is_leader() di Fase 1) supaya bisa membaca
-- public.users lepas dari RLS-nya sendiri, TAPI otorisasinya tetap dijaga
-- manual di WHERE clause: cuma boleh untuk instance milik pemanggil sendiri
-- (kalau panitia) atau instance manapun (kalau leader) -- baris SELAIN itu
-- tetap tidak akan pernah ikut ke-return, jadi tidak ada kebocoran data
-- lintas-instance.
-- =========================================================================

create or replace function public.list_akun_panitia_instance(p_kepanitiaan_site_id uuid)
returns table (id uuid, email text)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.email
  from public.users u
  where u.kepanitiaan_site_id = p_kepanitiaan_site_id
    and u.role = 'panitia'
    and (
      public.is_leader()
      or public.current_user_kepanitiaan_site_id() = p_kepanitiaan_site_id
    )
  order by u.email;
$$;

grant execute on function public.list_akun_panitia_instance(uuid) to authenticated;
