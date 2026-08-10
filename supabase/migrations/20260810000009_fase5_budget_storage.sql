-- Fase 5: Download/Submit Template Budgeting.
--
-- Jalankan lewat Supabase Dashboard > SQL Editor setelah migration
-- 20260809000001 s/d 20260810000008. Sandbox Claude Code tidak punya akses
-- network ke *.supabase.co (lihat HANDOVER.md), jadi migration ini perlu
-- dijalankan manual oleh Yolanda seperti fase-fase sebelumnya.

-- =========================================================================
-- 1. Satu baris budget_submissions per instance
-- =========================================================================
-- Tabel ini dibuat di Fase 1 tanpa unique constraint (belum ada UI yang
-- menulis ke sana). Widget budgeting di Fase 5 menampilkan status sebagai
-- SATU nilai skalar per instance ("belum"/"lengkap"), jadi perlu dijamin
-- maksimal 1 baris per kepanitiaan_site_id -- supaya upsert dari server
-- action (submitBudget) tidak membuat baris ganda kalau panitia upload
-- ulang beberapa kali.

alter table public.budget_submissions
  add constraint budget_submissions_one_per_instance unique (kepanitiaan_site_id);

-- =========================================================================
-- 2. Storage bucket: budget-template (master, satu file untuk semua instance)
-- =========================================================================
-- public = true -- sama seperti kepanitiaan-logo (migration Fase 4), ini
-- file referensi yang memang harus bisa didownload semua panitia lewat link
-- langsung tanpa signed URL yang kedaluwarsa. Yang dibatasi cuma siapa yang
-- boleh mengunggah/mengganti (leader), bukan siapa yang boleh melihat.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'budget-template',
  'budget-template',
  true,
  10485760,
  array[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "budget_template_read_all" on storage.objects;
create policy "budget_template_read_all" on storage.objects
  for select
  using (bucket_id = 'budget-template');

drop policy if exists "budget_template_insert_leader" on storage.objects;
create policy "budget_template_insert_leader" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'budget-template' and public.is_leader());

drop policy if exists "budget_template_update_leader" on storage.objects;
create policy "budget_template_update_leader" on storage.objects
  for update to authenticated
  using (bucket_id = 'budget-template' and public.is_leader())
  with check (bucket_id = 'budget-template' and public.is_leader());

drop policy if exists "budget_template_delete_leader" on storage.objects;
create policy "budget_template_delete_leader" on storage.objects
  for delete to authenticated
  using (bucket_id = 'budget-template' and public.is_leader());

-- =========================================================================
-- 3. Storage bucket: budget-submission (per instance, PRIVATE)
-- =========================================================================
-- public = false -- beda dari logo/template, file ini berisi dokumen budget
-- sungguhan milik satu instance kepanitiaan+site, jadi tidak boleh diakses
-- siapa saja lewat URL publik. Path objek selalu diawali
-- "<kepanitiaan_site_id>/...", dan storage.foldername(name) (helper bawaan
-- Supabase Storage) dipakai di policy untuk mencocokkan folder itu ke
-- instance milik pemanggil -- versi Storage dari pola
-- "kepanitiaan_site_id = current_user_kepanitiaan_site_id()" yang sudah
-- dipakai di RLS tabel biasa sejak Fase 1.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'budget-submission',
  'budget-submission',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "budget_submission_scoped_select" on storage.objects;
create policy "budget_submission_scoped_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'budget-submission'
    and (
      public.is_leader()
      or (storage.foldername(name))[1] = public.current_user_kepanitiaan_site_id()::text
    )
  );

drop policy if exists "budget_submission_scoped_insert" on storage.objects;
create policy "budget_submission_scoped_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'budget-submission'
    and (
      public.is_leader()
      or (storage.foldername(name))[1] = public.current_user_kepanitiaan_site_id()::text
    )
  );

drop policy if exists "budget_submission_scoped_update" on storage.objects;
create policy "budget_submission_scoped_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'budget-submission'
    and (
      public.is_leader()
      or (storage.foldername(name))[1] = public.current_user_kepanitiaan_site_id()::text
    )
  )
  with check (
    bucket_id = 'budget-submission'
    and (
      public.is_leader()
      or (storage.foldername(name))[1] = public.current_user_kepanitiaan_site_id()::text
    )
  );

drop policy if exists "budget_submission_scoped_delete" on storage.objects;
create policy "budget_submission_scoped_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'budget-submission'
    and (
      public.is_leader()
      or (storage.foldername(name))[1] = public.current_user_kepanitiaan_site_id()::text
    )
  );
