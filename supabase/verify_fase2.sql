-- Skrip verifikasi manual untuk Fase 2 (auto-seed bucket + RPC pembuatan
-- kepanitiaan multi-site).
-- Jalankan SETELAH migration 20260809000002_fase2_kepanitiaan_dan_seed_bucket.sql
-- sukses (dan tentu setelah migration Fase 1).
--
-- Sandbox Claude Code tidak punya akses network ke *.supabase.co, jadi
-- verifikasi ini harus dijalankan manual oleh Yolanda: lewat Supabase
-- Dashboard (SQL Editor, "Run as authenticated user" dengan akun leader)
-- atau lewat halaman /leader/kepanitiaan/baru di `npm run dev`.

-- =========================================================================
-- Cara paling gampang: lewat UI
-- =========================================================================
-- 1) Login sebagai akun leader di /login, lalu masuk ke
--    /leader/kepanitiaan/baru.
-- 2) Isi "Nama Kepanitiaan" = FIND, dan di kolom "Tambah site baru" isi:
--      Ciawi-Sentul, Cibitung, Jakarta-Area
-- 3) Submit. Setelah redirect ke /leader/kepanitiaan, harus muncul satu
--    card "FIND" dengan 3 tombol site: Ciawi-Sentul, Cibitung,
--    Jakarta-Area.
-- 4) Klik salah satu tombol site -> halaman detail instance harus
--    menampilkan 6 bucket default (Penetapan Susunan Kepanitiaan,
--    Budgeting, Acara, Perlengkapan/Logistik/Transportasi, Publikasi dan
--    Dokumentasi, Konsumsi), dan "Budgeting" ditandai "(budgeting)".
-- 5) Ulangi untuk 2 site lain -> tiap instance harus punya 6 bucket
--    sendiri-sendiri (18 baris bucket total untuk 3 instance FIND).
-- 6) Tambah beberapa anggota panitia lewat form "Susunan Panitia" di
--    salah satu instance, lalu edit dan hapus salah satunya -> pastikan
--    perubahan tersimpan dan tidak memengaruhi 2 instance lain.

-- =========================================================================
-- Cara verifikasi lewat SQL Editor (sebagai service role, hanya untuk
-- memastikan datanya benar setelah langkah UI di atas)
-- =========================================================================

-- Harus mengembalikan 3 baris (satu per site FIND):
select ks.id as instance_id, k.nama as kepanitiaan, s.nama_site
from public.kepanitiaan_site ks
join public.kepanitiaan k on k.id = ks.kepanitiaan_id
join public.sites s on s.id = ks.site_id
where k.nama = 'FIND';

-- Harus mengembalikan 6 baris per instance_id di atas (18 total untuk 3
-- instance), dengan tepat 1 baris nama_bidang = 'Budgeting' yang
-- is_budgeting = true per instance:
select kepanitiaan_site_id, nama_bidang, is_default, is_budgeting
from public.buckets
where kepanitiaan_site_id in (
  select ks.id from public.kepanitiaan_site ks
  join public.kepanitiaan k on k.id = ks.kepanitiaan_id
  where k.nama = 'FIND'
)
order by kepanitiaan_site_id, nama_bidang;

-- =========================================================================
-- Uji RLS tambahan khusus Fase 2 (RPC & committee_members)
-- =========================================================================
-- 7) Coba panggil RPC create_kepanitiaan_dengan_sites lewat akun PANITIA
--    (bukan leader) -- misalnya lewat `supabase-js` dengan access token
--    panitia -- harus GAGAL dengan error RLS (policy
--    "kepanitiaan_write_leader"/"sites_write_leader" menolak insert),
--    bukan berhasil membuat kepanitiaan baru.
-- 8) Login sebagai akun panitia instance A, buka /panitia/susunan, tambah
--    1 anggota. Login sebagai akun panitia instance B, buka /panitia/susunan
--    -> anggota yang baru ditambahkan di instance A TIDAK BOLEH muncul di
--    instance B (RLS "committee_members_scoped" bekerja sama seperti tabel
--    operasional lain di Fase 1).

-- Bersihkan data uji setelah selesai (opsional):
--   delete from public.kepanitiaan where nama = 'FIND';
--   delete from public.sites where nama_site in ('Ciawi-Sentul', 'Cibitung', 'Jakarta-Area');
