-- Skrip verifikasi manual untuk Fase 3 (Timeline Pelaksanaan) khusus bagian
-- yang belum bisa dicek dari akun leader: independensi timeline antar-
-- instance dari sisi akun PANITIA, dan isolasi RLS `timeline_milestones_scoped`.
--
-- Kenapa perlu ini: akun test `panitia-a@test.local`/`panitia-b@test.local`
-- dari verifikasi Fase 1 (lihat verify_rls_fase1.sql) kemungkinan besar
-- baris `public.users`-nya sudah hilang -- HANDOVER.md mencatat data test
-- `*@test.local` dibersihkan Yolanda setelah Fase 1 selesai, dan instance
-- lama yang jadi rujukan `kepanitiaan_site_id` mereka (FIND @ Ciawi-
-- Sentul/Cibitung versi test) juga sudah tidak ada. Kalau baris auth.users-
-- nya (akun login-nya sendiri) masih ada tapi baris public.users-nya hilang,
-- login akan sukses di Supabase Auth tapi DITOLAK oleh app dengan pesan
-- "Akun ini belum terdaftar di sistem orientasi panitia" -- ini kemungkinan
-- besar yang terjadi kalau login panitia-a/b@test.local "ditolak".

-- =========================================================================
-- 1. Cek apakah akunnya masih ada di Supabase Auth
-- =========================================================================
-- Dashboard > Authentication > Users, cari "panitia-a@test.local" dan
-- "panitia-b@test.local".
--   - Kalau ADA -> catat UID masing-masing, lanjut ke langkah 3.
--   - Kalau TIDAK ADA -> klik "Add user" untuk masing-masing email (password
--     bebas, aktifkan "Auto Confirm User"), lalu catat UID barunya, lanjut
--     ke langkah 3.

-- =========================================================================
-- 2. Cari 2 instance kepanitiaan_site yang BEDA untuk dites (pakai data
--    yang sudah ada, jangan bikin instance test baru lagi)
-- =========================================================================
select ks.id as instance_id, k.nama as kepanitiaan, s.nama_site
from public.kepanitiaan_site ks
join public.kepanitiaan k on k.id = ks.kepanitiaan_id
join public.sites s on s.id = ks.site_id
order by k.nama, s.nama_site;
-- Pilih 2 baris `instance_id` yang berbeda dari hasil di atas (idealnya dari
-- kepanitiaan yang sama tapi site berbeda, misal 2 instance yang sudah
-- dites independensinya di Fase 3 -- catat sebagai <INSTANCE_A_ID> dan
-- <INSTANCE_B_ID>).

-- =========================================================================
-- 3. Upsert baris public.users supaya kedua akun test terhubung ke 2
--    instance yang berbeda itu (aman dijalankan ulang -- upsert, bukan
--    insert polos)
-- =========================================================================
insert into public.users (id, email, role, kepanitiaan_site_id) values
  ('<PANITIA_A_UID>', 'panitia-a@test.local', 'panitia', '<INSTANCE_A_ID>'),
  ('<PANITIA_B_UID>', 'panitia-b@test.local', 'panitia', '<INSTANCE_B_ID>')
on conflict (id) do update
  set role = excluded.role,
      kepanitiaan_site_id = excluded.kepanitiaan_site_id;

-- =========================================================================
-- 4. Test isolasi Timeline dari sisi akun panitia
-- =========================================================================
-- a) Login sebagai panitia-a@test.local di /login, buka /panitia/timeline
--    -> harus cuma nampilin milestone instance_a. Coba tambah 1 milestone
--    baru di sini.
-- b) Logout, login sebagai panitia-b@test.local, buka /panitia/timeline
--    -> harus cuma nampilin milestone instance_b, TIDAK BOLEH ada milestone
--    yang baru ditambahkan panitia-a di langkah (a).
-- c) (Opsional) Ulangi pola yang sama untuk /panitia/susunan kalau mau
--    sekaligus menutup celah verifikasi Fase 2 poin 7-8 di verify_fase2.sql.

-- =========================================================================
-- 5. Bersihkan (opsional) -- kalau instance_a/instance_b di atas adalah
--    instance ASLI (bukan data test), JANGAN hapus instance-nya, cukup
--    lepas akun test dari situ atau hapus milestone yang ditambahkan saat
--    testing:
-- =========================================================================
--   delete from public.timeline_milestones where nama_milestone = '<nama milestone test yang ditambahkan>';
--   -- akun public.users boleh dibiarkan untuk dipakai lagi di verifikasi berikutnya,
--   -- atau hapus kalau memang sudah tidak perlu:
--   -- delete from public.users where email in ('panitia-a@test.local', 'panitia-b@test.local');
