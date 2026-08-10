-- Panduan: mendaftarkan akun test (panitia-a/b/d/e@test.local) ke instance
-- yang benar, supaya bisa LOGIN dan membuka instance itu.
--
-- KONSEP PENTING (baca dulu sebelum jalankan apapun):
-- "Susunan Panitia" (tombol + Tambah Anggota di aplikasi) HANYA daftar
-- nama -- tidak memberi hak akses login. Hak akses login ke sebuah
-- instance ditentukan oleh kolom public.users.kepanitiaan_site_id, dan itu
-- HANYA bisa diatur lewat SQL Editor / Table Editor di Supabase Dashboard,
-- bukan lewat aplikasi. Satu akun cuma bisa terhubung ke SATU instance
-- dalam satu waktu (sesuai desain awal HANDOVER.md: "satu akun per instance
-- kepanitiaan+site").
--
-- Urutan yang benar: SELALU Langkah 1 (SQL, ikat akun ke instance) dulu,
-- BARU Langkah 2 (aplikasi, tambahkan ke Susunan Panitia). Kalau dibalik,
-- akun itu tidak akan muncul di dropdown "+ Tambah Anggota" -- dropdown-nya
-- cuma menampilkan akun yang SUDAH terikat ke instance itu (lihat migration
-- 20260810000008, RPC list_akun_panitia_instance).

-- =========================================================================
-- Langkah 0 -- Lihat instance mana yang tersedia, catat instance_id-nya
-- =========================================================================
select ks.id as instance_id, k.nama as kepanitiaan, s.nama_site
from public.kepanitiaan_site ks
join public.kepanitiaan k on k.id = ks.kepanitiaan_id
join public.sites s on s.id = ks.site_id
order by k.nama, s.nama_site;

-- Cek juga instance mana yang SEKARANG jadi rumah tiap akun test (supaya
-- tidak menebak-nebak):
select email, kepanitiaan_site_id
from public.users
where email in (
  'panitia-a@test.local',
  'panitia-b@test.local',
  'panitia-d@test.local',
  'panitia-e@test.local'
);

-- =========================================================================
-- Langkah 1 -- Ikat ulang akun ke instance TUJUAN (SQL Editor)
-- =========================================================================
-- Ganti <INSTANCE_X_ID> di bawah dengan instance_id yang mau dituju untuk
-- masing-masing akun (dari hasil query Langkah 0). Boleh diisi instance
-- yang SAMA untuk beberapa akun sekaligus (misal semua diarahkan ke PON @
-- Jakarta) kalau memang itu maunya -- tidak wajib beda-beda.
--
-- PERHATIAN: ini MEMINDAHKAN akun, bukan menambah. Begitu dijalankan, akun
-- itu akan LEPAS dari instance lama-nya (kalau ada verifikasi RLS yang
-- masih bergantung ke instance lama tersebut, lihat HANDOVER.md Catatan
-- Teknis Fase 3/4 untuk riwayatnya).

update public.users set kepanitiaan_site_id = '<INSTANCE_UNTUK_PANITIA_A>'
  where email = 'panitia-a@test.local';

update public.users set kepanitiaan_site_id = '<INSTANCE_UNTUK_PANITIA_B>'
  where email = 'panitia-b@test.local';

update public.users set kepanitiaan_site_id = '<INSTANCE_UNTUK_PANITIA_D>'
  where email = 'panitia-d@test.local';

update public.users set kepanitiaan_site_id = '<INSTANCE_UNTUK_PANITIA_E>'
  where email = 'panitia-e@test.local';

-- Jalankan ulang query cek di Langkah 0 untuk pastikan sudah pindah dengan
-- benar sebelum lanjut ke Langkah 2.

-- =========================================================================
-- Langkah 2 -- Tambahkan ke Susunan Panitia LEWAT APLIKASI (bukan SQL)
-- =========================================================================
-- 1. Login sebagai leader.
-- 2. Buka instance tujuan (Manajemen Kepanitiaan -> pilih event -> pilih
--    site-nya).
-- 3. Tab "Susunan Panitia" -> buka bidang manapun -> klik "+ Tambah
--    Anggota".
-- 4. Email panitia-a/b/d/e SEHARUSNYA sekarang muncul di dropdown (karena
--    Langkah 1 sudah mengikatnya ke instance ini). Kalau TIDAK muncul,
--    berarti Langkah 1 belum berhasil untuk akun itu -- ulangi cek Langkah 0.
-- 5. Isi Nama, pilih emailnya dari dropdown, Simpan.

-- =========================================================================
-- Langkah 3 -- Coba login sebagai akun itu untuk pastikan
-- =========================================================================
-- Login dengan email + password akun test itu -> harus langsung masuk ke
-- /panitia/workspace milik instance TUJUAN (bukan instance lama), dan nama
-- yang baru ditambahkan di Langkah 2 muncul di tab Susunan Panitia.
