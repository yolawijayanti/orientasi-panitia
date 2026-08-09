# Konsep: Aplikasi Tracking Progres Panitia

## 1. Masalah

Sulit memantau sudah sejauh mana progres tiap anggota tim panitia dalam menyelesaikan
tugasnya. Saat ini task list tersebar di SharePoint — kurang intuitif, dan tidak ada
mekanisme yang memastikan kolom-kolom penting benar-benar terisi. Akibatnya, panitia
cenderung menunda-nunda input progres.

## 2. Constraint

Solusi harus mudah diakses dari HP maupun laptop, supaya panitia tidak punya alasan
untuk menunda input progres karena kesulitan akses.

## 3. Solusi yang dipilih

**Aplikasi web sederhana custom**, dengan alasan:
- Bentuk laporan dan task list bisa dirancang sendiri agar lebih intuitif dan
  memastikan field wajib benar-benar terisi (tidak bisa dicapai dengan sekadar
  merapikan SharePoint atau pindah ke spreadsheet/chat).
- Tim Employee Relations (ER) adalah PIC nasional permanen untuk kepanitiaan ini,
  sehingga ada kepemilikan jangka panjang untuk maintain aplikasi.
- Target pengguna (Gen Z & milenial akhir) tech-savvy, sehingga risiko learning
  curve/onboarding lebih rendah dibanding asumsi umum.

## 4. Risiko yang sudah diidentifikasi, dan mitigasinya

| # | Risiko | Mitigasi |
|---|--------|----------|
| 1 | Menunda-nunda input bisa jadi soal *perilaku*, bukan alat | Divalidasi: penyebabnya bentuk laporan yang scattered & tidak ada validasi field wajib — app dirancang khusus untuk menghilangkan friksi ini (required fields, form intuitif) |
| 2 & 9 | Single point of failure (developer tunggal) + app rawan gagal di titik paling kritis (H-1/H-day) | - Pilih stack mainstream (bukan eksotis)<br>- Pairing dengan rekan kerja sejak awal development, bukan cuma siaga darurat<br>- Code freeze sebelum H-day (mis. H-7), setelah itu hanya bug fix<br>- Soft launch/dry run minimal H-14 dengan data panitia sungguhan<br>- Siapkan fallback manual (template Sheet kosong) untuk diaktifkan kalau app down saat crunch time<br>- Dokumentasikan runbook (`RUNBOOK.md`): cara redeploy, reset akun admin, lokasi secret, contact person hosting/DB |
| 3 | Bus factor develop | Diselesaikan — dibagikan ke rekan kerja sebagai backup SDM debugging |
| 4 | Onboarding & learning curve | Target user tech-savvy (Gen Z/milenial akhir), risiko lebih rendah dari asumsi awal |
| 5 | Auth butuh database? | Lihat detail di bagian 5 di bawah |
| 6 | Reminder terasa seperti tugas tambahan / notifikasi tidak reliable | Kirim reminder via email digest harian (bukan realtime per-event), plus indikator visual di dalam app sebagai fallback kalau email masuk spam |
| 7 | Keberlanjutan (siapa pegang app tahun depan) | Diselesaikan — tim ER adalah PIC nasional permanen, jadi kepemilikan sudah jelas |
| 8 | Data pribadi panitia | Lihat prinsip minimalisasi PII di bagian 6 |
| 10 | Privasi data & minimalisasi PII | Lihat bagian 6 |

## 5. Keputusan Auth

SSO (Microsoft/Azure AD) **tidak bisa dipakai** karena dibatasi kebijakan kantor.

**Keputusan: passwordless email login (magic link atau OTP)**, dikombinasikan dengan
allow-list email yang dikelola admin (tim ER):

- User masukkan email kerja → dapat link/kode OTP di email → login. Tidak ada
  password untuk dikelola, dicuri, atau di-reuse.
- Admin (tim ER) menjaga daftar email yang diizinkan login (idealnya akun
  pre-provisioned, bukan self-registration bebas) — mencegah orang di luar daftar
  panitia mengakses sistem.
- Didukung out-of-the-box oleh Supabase Auth (atau alternatif setara: Firebase Auth,
  Clerk) — tidak perlu membangun sistem hashing password sendiri.

**Butuh database?** Ya — untuk data aplikasi (task, assignment, status, timestamp),
bukan untuk kredensial (karena passwordless). Cukup pakai layanan auth+DB terkelola
(Supabase/Firebase), tidak perlu server auth custom.

**Rencana migrasi ke SSO di masa depan** (kalau kebijakan berubah):
1. Sejak awal, referensikan user berdasarkan `user_id`/email di semua tabel — jangan
   menempelkan logic "email+password" ke business logic.
2. Saat siap, aktifkan provider Microsoft/Azure AD di Supabase Auth (butuh app
   registration dari tim IT) — di sisi kode cukup tambah tombol "Login with
   Microsoft".
3. Supabase mencocokkan akun berdasarkan email, sehingga histori data user yang sama
   tetap nyambung saat pindah metode login.
4. Dua metode auth bisa berjalan berdampingan selama masa transisi, baru matikan
   magic link setelah semua user pindah.

Kesimpulan: migrasi ke SSO nanti bersifat **konfigurasi, bukan rewrite** — selama
desain awal tidak mengikat logic ke password.

## 6. Prinsip Privasi & Minimalisasi Data Pribadi

- Kumpulkan sesedikit mungkin data: hanya nama, email kerja, role/divisi kepanitiaan,
  task assignment, status & timestamp update. Tidak perlu nomor HP, alamat, tanggal
  lahir, dsb.
- Status task ("belum/proses/selesai") adalah data pekerjaan, risikonya rendah;
  yang perlu dijaga ketat adalah identitas (nama+email) yang menempel padanya.
- Access control by role: panitia biasa hanya lihat task miliknya sendiri (+ mungkin
  summary agregat tim); admin (tim ER) baru bisa lihat detail siapa PIC per task.
- Retention policy: hapus/arsipkan data setelah acara selesai + periode tertentu
  (mis. 3–6 bulan), jangan menumpuk data panitia lintas tahun tanpa batas.
- Jangan expose database langsung ke internet — akses hanya lewat backend app
  dengan role-based rules (mis. Row Level Security di Supabase); simpan
  secret/API key di environment variable, bukan hardcoded.
- Cek dulu ke tim IT/data privacy internal — sebagai tim ER yang mengelola data
  karyawan, kemungkinan sudah ada kebijakan internal (terkait UU PDP) yang perlu
  diselaraskan sebelum go-live.

## 7. Hosting & Biaya

Supabase free tier cukup untuk skala ini (per Agustus 2026):
- 500 MB database, 1 GB file storage, 50.000 monthly active users, 5 GB egress
- Maksimal 2 project aktif

**Catatan:** project di free tier otomatis pause setelah 7 hari tanpa aktivitas API.
Karena penggunaan aplikasi ini bersifat musiman (ramai saat periode kepanitiaan,
sepi di luar itu), project kemungkinan perlu di-resume manual dari dashboard
sebelum siklus kepanitiaan berikutnya dimulai. Data tidak hilang saat pause.

## 8. Langkah Selanjutnya

Skema data (tabel) dan screen flow akan dirancang di sesi terpisah.
