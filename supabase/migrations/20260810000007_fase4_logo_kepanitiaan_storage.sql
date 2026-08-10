-- Fase 4 (revisi ronde 2): upload logo/foto kepanitiaan.
--
-- Jalankan lewat Supabase Dashboard > SQL Editor setelah migration
-- 20260809000001 s/d 20260810000006.
--
-- Ini migration pertama yang menyentuh Supabase Storage. Bucket-nya dibuat
-- lewat SQL (bukan klik-klik di Dashboard) supaya langkahnya ikut tercatat
-- di repo seperti migration lain, dan bisa diulang di project Supabase baru
-- tanpa mengingat-ingat setting manual.

-- =========================================================================
-- 1. Kolom logo_url di tabel kepanitiaan
-- =========================================================================
-- Menyimpan URL publik hasil upload, bukan file-nya. Nullable: kepanitiaan
-- lama (dan yang baru dibuat) boleh belum punya logo.

alter table public.kepanitiaan
  add column if not exists logo_url text;

-- =========================================================================
-- 2. Storage bucket
-- =========================================================================
-- public = true: logo kepanitiaan bukan data sensitif, dan bucket publik
-- membuat URL-nya bisa dipakai langsung di <img src> tanpa perlu signed URL
-- yang kedaluwarsa. Yang dibatasi adalah siapa yang boleh MENGUNGGAH
-- (lihat policy di bawah), bukan siapa yang boleh melihat.
--
-- file_size_limit 2 MB dan daftar mime type dipasang di level bucket supaya
-- file yang tidak sesuai ditolak Storage sendiri, bukan cuma oleh validasi
-- di server action (defense-in-depth, pola sama seperti trigger assignee).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kepanitiaan-logo',
  'kepanitiaan-logo',
  true,
  2097152,
  array['image/png', 'image/jpeg']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- =========================================================================
-- 3. Policy storage.objects untuk bucket ini
--
-- Baca: siapa saja (bucket publik, konsisten dengan public = true di atas).
-- Tulis/ubah/hapus: hanya leader -- logo menempel ke `kepanitiaan`, yang
-- memang cuma boleh dikelola leader (lihat policy kepanitiaan_write_leader
-- di migration Fase 1). Pakai helper public.is_leader() yang sama.
-- =========================================================================

drop policy if exists "kepanitiaan_logo_read_all" on storage.objects;
create policy "kepanitiaan_logo_read_all" on storage.objects
  for select
  using (bucket_id = 'kepanitiaan-logo');

drop policy if exists "kepanitiaan_logo_insert_leader" on storage.objects;
create policy "kepanitiaan_logo_insert_leader" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kepanitiaan-logo' and public.is_leader());

drop policy if exists "kepanitiaan_logo_update_leader" on storage.objects;
create policy "kepanitiaan_logo_update_leader" on storage.objects
  for update to authenticated
  using (bucket_id = 'kepanitiaan-logo' and public.is_leader())
  with check (bucket_id = 'kepanitiaan-logo' and public.is_leader());

drop policy if exists "kepanitiaan_logo_delete_leader" on storage.objects;
create policy "kepanitiaan_logo_delete_leader" on storage.objects
  for delete to authenticated
  using (bucket_id = 'kepanitiaan-logo' and public.is_leader());
