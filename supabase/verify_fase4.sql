-- Skrip verifikasi manual untuk Fase 4 (Bucket Tugas & Breakdown) khusus
-- bagian yang belum bisa dicek dari akun leader sendirian: multi-assignee
-- di satu instance, "Tugas Saya", dan isolasi RLS `tasks_scoped`/
-- `subtasks_scoped` dari sisi akun PANITIA -- yang belum pernah benar-benar
-- dites lewat UI sejak dibuat di Fase 1.
--
-- STATUS: SUDAH DIJALANKAN & LOLOS SEMUA (lihat HANDOVER.md section 8/9).
-- Akun aslinya dibuat sebagai panitia-c@test.local, tapi sempat terkendala
-- login (root cause: query UPDATE ... WHERE email=... yang dicoba pertama
-- kali no-op karena baris dengan email itu belum ada -- bukan error, jadi
-- gejalanya membingungkan). Diganti jadi panitia-e@test.local (INSERT ...
-- ON CONFLICT, bukan UPDATE) di instance yang sama dengan panitia-c lama.
-- File ini dibiarkan (bukan dihapus) supaya bisa dipakai ulang kalau perlu
-- akun test serupa di fase berikutnya -- panitia-e/d masih aktif & terhubung
-- ke 2 instance berbeda, tidak perlu setup dari nol.

-- =========================================================================
-- 0. Catatan tentang panitia-a/panitia-b -- BACA DULU sebelum lanjut
-- =========================================================================
-- Sejak Fase 3 (verify_fase3.sql), panitia-a@test.local dan panitia-b@test.local
-- SENGAJA dihubungkan ke 2 instance BERBEDA (Habiha@Jakarta vs Habiha@Ciawi)
-- supaya bisa dites isolasi RLS-nya (panitia A tidak boleh lihat data B).
--
-- Selama verifikasi Fase 4, panitia-b DIPINDAH ke instance yang sama dengan
-- panitia-a (Habiha@Jakarta) supaya bisa dites skenario "dua orang di satu
-- instance, keduanya bisa di-assign tugas". Ini artinya SETUP ISOLASI LAMA
-- SUDAH TIDAK BERLAKU LAGI -- panitia-a dan panitia-b sekarang di instance
-- yang SAMA, bukan berbeda.
--
-- Supaya isolasi RLS tetap bisa dites tanpa mengganggu setup multi-assignee
-- yang sudah jalan, skrip ini membuat 2 akun test BARU (panitia-e/d) khusus
-- untuk itu. panitia-a/b dibiarkan seperti sekarang (satu instance, buat
-- verifikasi multi-assignee).

-- =========================================================================
-- 1. Cari 2 instance kepanitiaan_site yang BEDA untuk panitia-e/d
-- =========================================================================
select ks.id as instance_id, k.nama as kepanitiaan, s.nama_site
from public.kepanitiaan_site ks
join public.kepanitiaan k on k.id = ks.kepanitiaan_id
join public.sites s on s.id = ks.site_id
order by k.nama, s.nama_site;
-- Pilih 2 baris instance_id yang BERBEDA (boleh sama dengan instance A/B
-- lama di verify_fase3.sql, atau instance lain -- yang penting dua-duanya
-- beda). Catat sebagai <INSTANCE_C_ID> dan <INSTANCE_D_ID>.

-- =========================================================================
-- 2. Buat akun panitia-e@test.local / panitia-d@test.local di Supabase Auth
-- =========================================================================
-- Dashboard > Authentication > Users > "Add user" untuk masing-masing
-- email (password bebas, aktifkan "Auto Confirm User"). Catat UID
-- masing-masing.

-- =========================================================================
-- 3. Upsert baris public.users supaya kedua akun terhubung ke instance
--    C dan D yang BERBEDA (aman dijalankan ulang)
-- =========================================================================
insert into public.users (id, email, role, kepanitiaan_site_id) values
  ('<PANITIA_C_UID>', 'panitia-e@test.local', 'panitia', '<INSTANCE_C_ID>'),
  ('<PANITIA_D_UID>', 'panitia-d@test.local', 'panitia', '<INSTANCE_D_ID>')
on conflict (id) do update
  set role = excluded.role,
      kepanitiaan_site_id = excluded.kepanitiaan_site_id;

-- =========================================================================
-- 4. Tambahkan panitia-e & panitia-d ke Susunan Panitia instance masing-
--    masing lewat APLIKASI (bukan SQL) -- ini sekaligus jadi tes dropdown
--    "+ Tambah Anggota" yang baru dibatasi ke akun terdaftar
-- =========================================================================
-- a) Login sebagai leader, buka instance C -> tab Susunan Panitia -> buka
--    bidang manapun -> "+ Tambah Anggota" -> pastikan panitia-e@test.local
--    muncul di dropdown email (bukan lagi kotak ketik bebas) -> isi Nama,
--    pilih emailnya, Simpan.
-- b) Ulangi untuk panitia-d di instance D.

-- =========================================================================
-- 5. Test multi-assignee di SATU instance (panitia-a & panitia-b, sudah
--    di instance yang sama sejak langkah pemindahan sebelumnya)
-- =========================================================================
-- a) Login leader, buka instance Habiha@Jakarta -> Task Board -> buka satu
--    bidang -> buat 2 tugas -> assign tugas #1 ke panitia-a, tugas #2 ke
--    panitia-b lewat dropdown "Assign ke" -> pastikan dropdown menampilkan
--    KEDUANYA (bukti bug "per bidang cuma 1 orang" dari ronde sebelumnya
--    sudah benar-benar tertutup).
-- b) Login sebagai panitia-a@test.local -> /panitia/workspace -> tab
--    "Tugas Saya" -> pastikan tugas #1 muncul, tugas #2 (punya panitia-b)
--    TIDAK muncul.
-- c) Logout, login sebagai panitia-b@test.local -> tab "Tugas Saya" ->
--    pastikan sebaliknya: tugas #2 muncul, tugas #1 tidak.

-- =========================================================================
-- 6. Test isolasi RLS tasks_scoped/subtasks_scoped (panitia-e vs panitia-d,
--    beda instance) -- INI YANG BELUM PERNAH DITES SEJAK FASE 1
-- =========================================================================
-- a) Login sebagai panitia-e@test.local -> buka /panitia/workspace -> tab
--    Progres & Task Board -> tambah 1 tugas percobaan di bidang manapun,
--    assign ke diri sendiri (panitia-e).
-- b) Logout, login sebagai panitia-d@test.local -> buka Task Board ->
--    pastikan TIDAK melihat tugas yang baru ditambahkan panitia-e (beda
--    instance, harus benar-benar terpisah).
-- c) Masih sebagai panitia-d, coba akses langsung URL
--    /panitia/bucket/<uuid-bucket-di-instance-C> (copy UUID bucket dari
--    instance C lewat akun leader) -> harus kena halaman 404, bukan bocor
--    data instance lain.

-- =========================================================================
-- 7. Bersihkan (opsional)
-- =========================================================================
-- Kalau instance C/D di atas adalah instance ASLI (bukan data test), JANGAN
-- hapus instance-nya -- cukup hapus tugas percobaan dan/atau lepas akun
-- test dari Susunan Panitia lewat aplikasi:
--   delete from public.tasks where judul = '<judul tugas percobaan>';
-- Akun public.users boleh dibiarkan untuk dipakai lagi di verifikasi
-- fase berikutnya, atau hapus kalau memang sudah tidak perlu:
--   delete from public.users where email in ('panitia-e@test.local', 'panitia-d@test.local');
