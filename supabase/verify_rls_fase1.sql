-- Skrip verifikasi manual untuk RLS Fase 1.
-- Jalankan SETELAH migration 20260809000001_fase1_schema_and_rls.sql sukses.
--
-- Sandbox Claude Code tidak punya akses network ke *.supabase.co, jadi
-- verifikasi ini harus dijalankan manual oleh Yolanda: lewat Supabase
-- Dashboard (SQL Editor + Authentication) atau lewat `psql`/Supabase CLI
-- yang terhubung ke project asli.
--
-- Langkah:
--
-- 1) Di Authentication > Users, buat 3 user baru (password bebas, boleh
--    auto-confirm email):
--      - leader@test.local        -> catat UID sebagai :leader_uid
--      - panitia-a@test.local     -> catat UID sebagai :panitia_a_uid
--      - panitia-b@test.local     -> catat UID sebagai :panitia_b_uid
--
-- 2) Ganti semua placeholder <LEADER_UID>, <PANITIA_A_UID>, <PANITIA_B_UID>
--    di bawah ini dengan UID asli dari langkah 1, lalu jalankan blok SQL
--    berikut di SQL Editor (dijalankan sebagai service role / postgres,
--    jadi tidak kena RLS -- ini cuma untuk menyiapkan data uji).

insert into public.sites (nama_site) values ('Ciawi-Sentul'), ('Cibitung')
  returning id, nama_site;
-- catat id masing-masing sebagai :site_ciawi dan :site_cibitung

insert into public.kepanitiaan (nama) values ('FIND')
  returning id;
-- catat sebagai :kepanitiaan_find

insert into public.kepanitiaan_site (kepanitiaan_id, site_id) values
  ('<KEPANITIAAN_FIND_ID>', '<SITE_CIAWI_ID>'),
  ('<KEPANITIAAN_FIND_ID>', '<SITE_CIBITUNG_ID>')
  returning id, site_id;
-- catat instance Ciawi sebagai :instance_a, instance Cibitung sebagai :instance_b

insert into public.users (id, email, role, kepanitiaan_site_id) values
  ('<LEADER_UID>', 'leader@test.local', 'leader', null),
  ('<PANITIA_A_UID>', 'panitia-a@test.local', 'panitia', '<INSTANCE_A_ID>'),
  ('<PANITIA_B_UID>', 'panitia-b@test.local', 'panitia', '<INSTANCE_B_ID>');

insert into public.buckets (kepanitiaan_site_id, nama_bidang, is_default) values
  ('<INSTANCE_A_ID>', 'Acara', true),
  ('<INSTANCE_B_ID>', 'Acara', true);

-- 3) Login sebagai panitia-a@test.local (misal lewat halaman /login di
--    `npm run dev`, atau lewat REST API Supabase pakai anon key), lalu
--    jalankan query berikut sebagai user tersebut (bukan sebagai service
--    role -- di dashboard, pakai tab "Run as authenticated user" atau
--    hit lewat PostgREST/`supabase-js` dengan access token panitia-a):
--
--      select * from public.buckets;
--
--    Hasil yang BENAR: hanya muncul baris bucket milik instance_a
--    (Ciawi). Baris bucket instance_b (Cibitung) TIDAK BOLEH muncul.
--    Ini bukti RLS bekerja -- panitia A tidak bisa lihat data instance B.
--
-- 4) Ulangi langkah 3 dengan login sebagai panitia-b@test.local -> yang
--    muncul harus baris instance_b saja.
--
-- 5) Login sebagai leader@test.local -> query yang sama harus
--    mengembalikan SEMUA baris (instance_a dan instance_b).
--
-- 6) Selesai uji, hapus data uji ini (opsional, karena bakal ketimpa data
--    asli begitu Fase 2 mulai dipakai):
--
--      delete from public.users where email like '%@test.local';
--      delete from public.kepanitiaan where nama = 'FIND';
--      delete from public.sites where nama_site in ('Ciawi-Sentul', 'Cibitung');
