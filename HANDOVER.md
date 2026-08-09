# Handover: MVP Aplikasi Web Orientasi Panitia

Dokumen ini adalah rencana lengkap yang sudah **disetujui** untuk pembangunan MVP. Tiap fase akan dikerjakan di session Claude Code yang berbeda-beda — sebelum mulai kerja di fase manapun, baca dokumen ini dulu untuk konteks penuh, lalu cek bagian **Status Progres** di bagian bawah untuk tahu fase mana yang harus dikerjakan berikutnya.

## 1. Konteks Produk

Aplikasi web internal untuk mengelola kepanitiaan event (misal: **FIND**, **PON**) yang berjalan di beberapa **site** sekaligus dan paralel (misal FIND berjalan di site Ciawi-Sentul, Cibitung, dan Jakarta-Area; PON berjalan di site Ciawi, Sentul, Cibitung). Setiap kombinasi kepanitiaan+site adalah unit kerja independen dengan susunan panitia, timeline, tugas, dan budgeting sendiri-sendiri.

Ada dua jenis akun:
- **Akun panitia** — satu akun per instance kepanitiaan+site, akses terbatas ke datanya sendiri
- **Akun leader** (dipegang Yolanda) — akses ke semua instance, lihat progres lintas kepanitiaan/site lewat Dashboard Kepanitiaan

## 2. Fitur Wajib (Scope MVP — JANGAN ditambah di luar ini)

1. Page susunan panitia per instance kepanitiaan+site
2. Timeline pelaksanaan per instance kepanitiaan+site
3. Bucket kepanitiaan per bidang (6 bucket default + bisa tambah custom), berisi tugas besar + breakdown subtugas + deadline masing-masing
4. Download template budgeting & submit budget per kepanitiaan
5. Akun per kepanitiaan (panitia) + Dashboard Kepanitiaan untuk leader (multi-select instance yang mau direview)
6. Desain clean tapi fun khususnya di elemen reminder pengisian
7. Notifikasi berkala (reminder ke panitia menjelang deadline)
8. Notifikasi otomatis ke leader saat: (a) budget submission lengkap, (b) seluruh tugas dalam satu instance kepanitiaan selesai 100%

## 3. Fitur yang SENGAJA Ditunda (jangan dibangun dulu)

- Submit notulensi meeting
- Home berupa game path perjalanan (rumah → jungle → gunung) dengan progress journey panitia
- Leaderboard pengisian antar-site untuk kepanitiaan yang jalan paralel

## 4. Tech Stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Database + Auth + Storage | Supabase (Postgres, Auth, Storage, RLS) |
| Styling | Tailwind CSS + shadcn/ui |
| Notifikasi terjadwal | Supabase Edge Functions + pg_cron (atau Vercel Cron) |
| Notifikasi delivery | Email via Resend (MVP; WhatsApp/Telegram bisa upgrade nanti) |
| Deploy | Vercel |
| Asset desain fun (opsional) | Canva (via MCP) untuk ilustrasi/banner reminder |

## 5. Model Data

```sql
sites               (id, nama_site)
kepanitiaan         (id, nama)                                -- FIND, PON, dst
kepanitiaan_site    (id, kepanitiaan_id, site_id)              -- instance: "FIND @ Cibitung"
committee_members   (id, kepanitiaan_site_id, nama, email, role)  -- role: 'anggota' | 'leader_bidang'
buckets             (id, kepanitiaan_site_id, nama_bidang, is_default, is_budgeting)
tasks               (id, bucket_id, judul, deadline, status)
subtasks            (id, task_id, judul, deadline, status)
timeline_milestones (id, kepanitiaan_site_id, nama_milestone, tanggal_mulai, tanggal_selesai)
budget_submissions  (id, kepanitiaan_site_id, file_url, status, submitted_at)
users               (id, email, role: 'panitia' | 'leader', kepanitiaan_site_id nullable)
notifications_log   (id, kepanitiaan_site_id, jenis, sent_at)
```

Catatan penting:
- `kepanitiaan` dan `sites` adalah entitas independen. Semua data operasional (susunan panitia, timeline, bucket, budget) menempel ke `kepanitiaan_site` (instance gabungan), **bukan** ke `sites` saja.
- 5 bucket default di-seed otomatis setiap kali instance `kepanitiaan_site` baru dibuat: **Budgeting, Acara, Perlengkapan/Logistik/Transportasi, Publikasi dan Dokumentasi, Konsumsi**. Bucket "Budgeting" ditandai `is_budgeting = true` agar UI-nya menampilkan widget download-template + upload-submission (bukan cuma daftar tugas biasa). Panitia bisa tambah bucket custom lain (`is_default = false`). (Sebelumnya ada 6 bucket termasuk "Penetapan Susunan Kepanitiaan" — dihapus di revisi Fase 3 karena itu seharusnya jadi tugas di dalam bucket lain, bukan bidang/bucket tersendiri. Lihat migration `20260809000005_fase3_hapus_bucket_penetapan_susunan.sql`.)
- RLS Supabase: akun panitia hanya bisa akses baris yang terhubung ke `kepanitiaan_site_id` miliknya; akun leader bisa akses semua.

## 6. Urutan Pembangunan (kerjakan berurutan, satu fase = satu session)

### Fase 0 — Setup Project
- Init Next.js + TypeScript + Tailwind + shadcn/ui
- Setup project Supabase, simpan env keys (`.env.local`, jangan commit)
- Struktur folder: `app/(auth)`, `app/(panitia)`, `app/(leader)`, `lib/supabase`
- **Selesai jika:** project bisa `next dev` dan connect ke Supabase tanpa error

### Fase 1 — Auth & Skema Data
- Migration SQL untuk semua tabel di atas (section 5) + RLS policies sesuai catatan RLS
- Halaman login (akun panitia + akun leader)
- Middleware redirect berdasarkan role
- **Selesai jika:** login sukses, redirect sesuai role, RLS teruji (akun panitia A tidak bisa lihat data instance B)

### Fase 2 — Manajemen Kepanitiaan & Susunan Panitia
- Form leader: buat kepanitiaan baru → pilih site-site yang menjalankan → sistem otomatis generate instance `kepanitiaan_site` per site + auto-seed 6 bucket default
- Halaman susunan panitia (CRUD anggota) per instance
- **Selesai jika:** leader bisa membuat kepanitiaan "FIND" dengan 3 site sekaligus dan otomatis muncul 3 instance dengan bucket default masing-masing

### Fase 3 — Timeline Pelaksanaan
- Halaman timeline per instance `kepanitiaan_site` (vertical timeline sederhana)
- **Selesai jika:** timeline FIND@Cibitung dan FIND@Jakarta-Area independen satu sama lain

### Fase 4 — Bucket Tugas & Breakdown
- Halaman per bucket: daftar tugas besar → expand ke subtugas, masing-masing dengan deadline + status
- Tombol "+ Tambah Bidang" untuk bucket custom
- Progress bar sederhana per bucket
- **Selesai jika:** panitia bisa CRUD tugas/subtugas dan menambah bucket baru di instance-nya sendiri

### Fase 5 — Download/Submit Template Budgeting
- Bucket "Budgeting" (`is_budgeting=true`) render widget khusus: tombol download template (file statis di Supabase Storage) + form upload submission
- Status submission: belum / submitted lengkap
- **Selesai jika:** panitia bisa download template, upload file, dan statusnya berubah jadi lengkap

### Fase 6 — Dashboard Kepanitiaan (Leader)
- Landing page leader: checklist multi-select semua instance `kepanitiaan_site` (dikelompokkan per nama kepanitiaan)
- Dashboard menampilkan ringkasan progress gabungan (status tugas per bucket, status budgeting) untuk instance yang dicentang
- **Selesai jika:** leader bisa pilih beberapa instance sekaligus dan lihat perbandingan progres side-by-side

### Fase 7 — Notifikasi
- Reminder berkala ke panitia (cron cek deadline task/subtask mendekat, belum selesai) via email
- Notifikasi event-based ke leader: trigger saat `budget_submissions.status` → lengkap, dan saat seluruh task+subtask dalam satu instance berstatus selesai (100%)
- **Selesai jika:** email reminder terkirim sesuai jadwal, dan notif leader muncul tepat saat trigger terjadi (bukan polling manual)

### Fase 8 — Polish Desain
- Terapkan Tailwind + shadcn/ui secara konsisten, fokus di elemen reminder biar terasa "fun" (warna ceria, copy yang playful) tanpa menambah fitur gamifikasi
- Opsional: generate 2-3 asset ilustrasi/banner via Canva untuk elemen reminder
- **Selesai jika:** review visual QA — semua halaman utama (susunan panitia, timeline, bucket tugas, budgeting, dashboard) terasa konsisten dan clean

## 7. Fitur yang Sengaja Tidak Disiapkan Struktur Datanya

Jangan tambahkan tabel/kolom untuk: notulensi meeting, game path journey, leaderboard antar-site. Ini di luar scope MVP dan akan dibahas terpisah nanti.

## 8. Status Progres

> Update bagian ini setiap kali sebuah fase selesai dikerjakan, supaya session berikutnya tahu harus mulai dari mana.

- [x] Fase 0 — Setup Project (kode & struktur selesai; project Supabase sudah dibuat, `.env.local` terisi kredensial asli, `next build`/`next dev` sukses tanpa error dan sudah diverifikasi jalan lokal)
- [x] Fase 1 — Auth & Skema Data (migration SQL sudah dijalankan ke Supabase asli, RLS sudah diuji manual dan terbukti panitia A tidak bisa lihat data instance B, login lewat `npm run dev` sudah dicoba dan redirect sesuai role sukses untuk akun panitia maupun leader — diverifikasi langsung oleh Yolanda)
- [x] Fase 2 — Manajemen Kepanitiaan & Susunan Panitia (kedua migration sudah dijalankan ke Supabase asli dan diverifikasi live oleh Yolanda: form leader bisa membuat kepanitiaan multi-site, tiap instance otomatis dapat bucket default, menambah site ke kepanitiaan yang sudah ada juga jalan, dan CRUD susunan panitia berfungsi. Jumlah bucket default sekarang 5, bukan 6 lagi — lihat revisi ketiga Fase 3. Sisa yang belum diuji: isolasi RLS `committee_members` antar akun panitia + halaman `/panitia/susunan` dari sisi akun panitia — lihat `supabase/verify_fase2.sql` poin 7-8)
- [x] Fase 3 — Timeline Pelaksanaan (kode selesai termasuk 3 ronde revisi + 1 bugfix: flag status milestone, Gantt chart mingguan (+ bugfix drift tanggal), edit-lock milestone, bidang untuk leader_bidang, dan hapus bucket default "Penetapan Susunan Kepanitiaan". Kedua migration baru — `20260809000004_fase3_committee_bucket_assignment.sql` dan `20260809000005_fase3_hapus_bucket_penetapan_susunan.sql` — sudah dijalankan, dan Yolanda sudah konfirmasi live UI Timeline-nya jalan baik (Gantt chart, tab Vertikal, edit-lock, dropdown Bidang). **Belum eksplisit dikonfirmasi**: independensi timeline antar-instance & isolasi RLS dari sisi akun panitia — lihat detail & alasan risiko-rendahnya di Catatan Teknis Fase 3 di bawah)
- [ ] Fase 4 — Bucket Tugas & Breakdown
- [ ] Fase 5 — Download/Submit Template Budgeting
- [ ] Fase 6 — Dashboard Kepanitiaan (Leader)
- [ ] Fase 7 — Notifikasi
- [ ] Fase 8 — Polish Desain

**Fase berikutnya yang harus dikerjakan: Fase 4 — Bucket Tugas & Breakdown.** Kode & UI Fase 3 sudah diverifikasi live oleh Yolanda, tapi 2 hal spesifik (independensi timeline antar-instance, isolasi RLS dari akun panitia) belum eksplisit dicek ulang di sesi ini — risikonya dinilai rendah (lihat Catatan Teknis Fase 3), Yolanda yang putuskan mau dicek dulu atau lanjut. Sesi Fase 4 sebaiknya mulai dari branch `main` setelah PR Fase 3 (`claude/project-setup-fase-3-l58rjm` → `main`) di-merge — cek dulu section 6 & Catatan Teknis Fase 3 di bawah untuk konteks bucket (termasuk keputusan hapus bucket "Penetapan Susunan Kepanitiaan" — jadi Fase 4 sebaiknya menyediakan tempat/cara bagi leader untuk input tugas "penetapan susunan kepanitiaan" itu sebagai task biasa, bukan bidang tersendiri, kalau memang masih relevan dicatat sebagai tugas).

## 9. Catatan Teknis per Fase

> Detail implementasi & keputusan teknis tiap fase, supaya session berikutnya tidak perlu menebak-nebak dari riwayat chat yang sudah tidak ada.

### Fase 0 — Setup Project

**Struktur route yang benar-benar dibuat** (route group `(auth)`/`(panitia)`/`(leader)` tidak muncul di URL, jadi path aktualnya beda dari nama foldernya):
- `app/(auth)/login/page.tsx` → `/login` (placeholder, isi sungguhan di Fase 1)
- `app/(panitia)/panitia/dashboard/page.tsx` → `/panitia/dashboard` (placeholder, Fase 2+)
- `app/(leader)/leader/dashboard/page.tsx` → `/leader/dashboard` (placeholder, Fase 6)

Catatan: awalnya kedua route group `(panitia)` dan `(leader)` sama-sama punya halaman `dashboard` langsung di dalamnya, tapi ini **collision** — route group tidak menambah segment ke URL, jadi keduanya sama-sama resolve ke `/dashboard` dan `next build` gagal. Makanya masing-masing dinested lagi satu level (`panitia/dashboard`, `leader/dashboard`). Kalau mau ubah struktur URL di fase berikutnya, ingat aturan ini.

**shadcn/ui di-setup manual**, bukan lewat `npx shadcn init` — CLI resminya butuh akses ke `ui.shadcn.com` yang diblokir network policy sandbox Claude Code on the web saat itu. Yang dibuat manual: `components.json`, `lib/utils.ts` (helper `cn()`), design tokens (CSS variables) di `app/globals.css`, dependency inti (`clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `tw-animate-css`, `@radix-ui/react-slot`), dan satu komponen contoh `components/ui/button.tsx`. Kalau di session/environment lain `ui.shadcn.com` bisa diakses, silakan pakai `npx shadcn@latest add <component>` seperti biasa untuk komponen baru — strukturnya sudah kompatibel.

**Supabase client**: `lib/supabase/client.ts` (browser, pakai `createBrowserClient`) dan `lib/supabase/server.ts` (Server Component, pakai `createServerClient` + `cookies()` dari `next/headers`). Keduanya dari `@supabase/ssr`. Middleware untuk refresh session **belum dibuat** — itu bagian dari Fase 1 ("Middleware redirect berdasarkan role").

**Kredensial Supabase**: project sudah dibuat di supabase.com (Project URL: `https://hdzhlltitaxzirapkuqo.supabase.co`, key pakai format baru `sb_publishable_...`). Nilainya **hanya** ada di `.env.local` milik Yolanda secara lokal (tidak pernah di-commit, dilindungi `.gitignore` pola `.env*`). Template kosongnya ada di `.env.local.example` (ini yang di-commit). **Setiap session/environment baru yang mengerjakan project ini harus minta Yolanda isi ulang `.env.local` secara manual** — tidak bisa diasumsikan sudah ada, karena tidak tersimpan di repo maupun di sandbox cloud (sandbox bersifat ephemeral, hilang begitu session berakhir).

**Kendala network sandbox**: sandbox Claude Code on the web yang dipakai untuk Fase 0 memblokir koneksi HTTPS ke domain di luar allowlist (npm, GitHub, dst) — termasuk `*.supabase.co` dan `ui.shadcn.com`. Karena itu, verifikasi live koneksi ke Supabase **dilakukan manual oleh Yolanda di laptopnya sendiri** (clone branch, isi `.env.local`, `npm run dev`, cek tidak ada error) — bukan dari dalam sandbox. Kalau session berikutnya jalan di sandbox serupa dan butuh koneksi nyata ke Supabase (migration SQL di Fase 1, dst), kemungkinan besar akan kena kendala yang sama dan perlu strategi serupa: siapkan perintah/SQL-nya, minta Yolanda yang jalankan di sisi lokal atau lewat Supabase Dashboard (SQL Editor) langsung.

### Fase 1 — Auth & Skema Data

**Kendala network sama seperti Fase 0**: sandbox sesi ini (Claude Code remote execution environment) juga tidak punya akses ke `*.supabase.co` (dicoba `curl` ke project URL, hasilnya `403` dari proxy) maupun `ui.shadcn.com`. Jadi dari dalam sandbox, migration SQL/uji RLS/login sungguhan hanya diverifikasi tidak-langsung lewat `npm run build`, `npm run lint`, typecheck, dan smoke test `next dev` (cek redirect proxy jalan, dan server action login tidak crash walau `signInWithPassword` gagal connect).

**Verifikasi live sudah dilakukan Yolanda di laptopnya sendiri (bukan dari sandbox), hasilnya sukses:**
1. Migration `supabase/migrations/20260809000001_fase1_schema_and_rls.sql` sudah dijalankan lewat Supabase Dashboard > SQL Editor — 11 tabel + RLS policies sudah aktif di project asli.
2. Uji RLS sudah dilakukan mengikuti `supabase/verify_rls_fase1.sql` (2 akun panitia test di 2 instance berbeda + 1 akun leader) — terbukti panitia A hanya lihat data instance A, panitia B hanya instance B, leader lihat semua.
3. `.env.local` sudah diisi kredensial asli, `npm run dev` dijalankan, login dengan akun test berhasil dan redirect ke `/panitia/dashboard` maupun `/leader/dashboard` sesuai role masing-masing.

Data test (`*@test.local`) sudah dibersihkan Yolanda dari database setelah verifikasi selesai — jadi kalau di Fase 2 nanti tabel `sites`/`kepanitiaan`/`kepanitiaan_site`/`users` masih kosong, itu wajar, bukan bug.

**`middleware.ts` → `proxy.ts`**: Next.js 16 men-deprecate file convention `middleware.js` dan menggantinya dengan `proxy.js` (fungsi dan nama file berubah, behavior sama — lihat `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). Karena itu redirect-berdasarkan-role dan refresh session Supabase ditaruh di **`proxy.ts`** di root project (bukan `middleware.ts`), dengan fungsi bernama `proxy` (bukan `middleware`). Logic session-refresh-nya sendiri ada di helper `lib/supabase/middleware.ts` (nama file helper ini sengaja dipertahankan, karena bukan file-convention Next.js — cuma modul biasa; kalau mau di-rename ke `lib/supabase/proxy.ts` boleh, tidak ada bedanya secara fungsional). `proxy.ts` meng-exclude `_next/static`, `_next/image`, `favicon.ico`, dan file gambar statis dari matcher-nya.

**Auth flow**: pakai Next.js Server Actions (React 19 `useActionState`), bukan client-side `fetch` ke Supabase langsung — mengikuti pola resmi Supabase+Next.js App Router.
- `lib/auth/actions.ts`: `login(prevState, formData)` — panggil `supabase.auth.signInWithPassword`, lalu query role dari `public.users`, lalu `redirect()` ke `/panitia/dashboard` atau `/leader/dashboard`. Kalau gagal (password salah / user belum ada di `public.users`), return `{ error: "..." }` (tidak melempar exception, supaya `useActionState` di client bisa nampilin pesan error). `logout()` — `supabase.auth.signOut()` lalu redirect ke `/login`.
- `app/(auth)/login/login-form.tsx` (client component) memanggil `login` lewat `useActionState`, dan `app/(auth)/login/page.tsx` membungkusnya dengan `Card` dari shadcn/ui.
- `components/logout-button.tsx`: form kecil yang langsung `action={logout}` (server action), dipakai di kedua dashboard placeholder biar mudah dites bolak-balik role tanpa buka tab incognito baru terus.

**Role redirect di `proxy.ts`**: setiap request (kecuali asset statis) memanggil `supabase.auth.getUser()` (bukan `getSession()` — `getUser()` yang mem-verifikasi & refresh token server-side, sesuai rekomendasi Supabase). Kalau belum login dan akses `/panitia/*`, `/leader/*`, atau `/` → redirect ke `/login`. Kalau sudah login: akses `/login` atau `/` → redirect ke dashboard sesuai role; panitia yang coba akses `/leader/*` atau leader yang coba akses `/panitia/*` → di-redirect balik ke dashboard sendiri (bukan 403, biar UX-nya nggak nyangkut di halaman error).

**Skema data & RLS** (`supabase/migrations/20260809000001_fase1_schema_and_rls.sql`):
- Semua 10 tabel di section 5 dibuat sesuai model data, dengan tambahan `created_at` di tiap tabel dan check constraint untuk kolom status/role yang disebutkan eksplisit di handover (`users.role`, `committee_members.role`, `tasks.status`/`subtasks.status` pakai `belum`/`proses`/`selesai`, `budget_submissions.status` pakai `belum`/`lengkap` sesuai istilah di section Fase 5). `notifications_log.jenis` sengaja dibiarkan `text` bebas (belum di-constrain) karena daftar jenis notifikasi belum diputuskan final — itu keputusan Fase 7.
- `public.users.id` adalah FK langsung ke `auth.users.id` (satu baris `public.users` = satu akun Supabase Auth). **Tidak ada trigger auto-insert dari `auth.users` ke `public.users`** — akun panitia/leader sengaja dibuat manual oleh leader (lewat Supabase Dashboard atau Fase 2 nanti), jadi `role` dan `kepanitiaan_site_id` selalu diisi sadar, bukan default kosong.
- RLS pakai 3 helper function `security definer` (`current_user_role()`, `current_user_kepanitiaan_site_id()`, `is_leader()`) yang baca `public.users` tanpa kena RLS-nya sendiri — ini untuk menghindari infinite recursion kalau policy tabel `users` butuh cek role dari tabel `users` itu sendiri. Semua tabel operasional pakai pola `is_leader() OR kepanitiaan_site_id = current_user_kepanitiaan_site_id()`; untuk `tasks`/`subtasks` yang tidak punya `kepanitiaan_site_id` langsung, resolve lewat join ke `buckets` (dan `tasks` untuk `subtasks`).
- Bucket seeding otomatis (6 bucket default saat `kepanitiaan_site` baru dibuat) **belum dibuat di migration ini** — itu memang scope Fase 2 ("Manajemen Kepanitiaan"), bukan Fase 1 ("Migration SQL + RLS" saja). Kalau di Fase 2 mau pakai DB trigger untuk auto-seed, tinggal tambah migration baru, jangan ubah file ini.

**shadcn/ui component baru**: `input.tsx`, `label.tsx` (butuh `@radix-ui/react-label`, sudah ditambahkan ke `package.json`), `card.tsx` — dibuat manual dengan pola yang sama seperti `button.tsx` di Fase 0 (network ke `ui.shadcn.com` masih diblokir, sudah dicoba `npx shadcn@latest add` dan gagal dengan error yang sama seperti di Fase 0).

**`app/page.tsx`**: konten boilerplate `create-next-app` diganti jadi `redirect("/login")` polos — karena `proxy.ts` sudah selalu redirect `/` ke `/login` atau dashboard sesuai role duluan, halaman ini praktis cuma fallback kalau proxy ter-skip (harusnya tidak pernah kejadian secara normal).

### Fase 2 — Manajemen Kepanitiaan & Susunan Panitia

**`npm install` dijalankan di sandbox** (baru pertama kali — `node_modules` belum pernah ada sebelumnya di sessions Fase 0/1). Ternyata registry npm memang tidak diblokir (sesuai catatan Fase 0/1: yang diblokir cuma domain di luar allowlist seperti `*.supabase.co` dan `ui.shadcn.com`), jadi dependency ter-install normal dan `next build`/`next lint`/`tsc --noEmit` bisa dijalankan sungguhan di sandbox ini (bukan cuma dibaca kodenya). `.env.local` diisi nilai placeholder sementara hanya untuk keperluan `next build` di sandbox (supaya module `lib/supabase/*` tidak crash saat baca `process.env`), lalu dihapus lagi sebelum commit — **tidak pernah** commit ke git (tetap terlindungi `.gitignore` pola `.env*`). Koneksi nyata ke Supabase tetap tidak bisa dites dari sandbox ini (belum dicoba ulang, tapi tidak ada indikasi allowlist `*.supabase.co` berubah), jadi migration & RLS baru tetap perlu dijalankan manual oleh Yolanda seperti Fase 1.

**Migration baru**: `supabase/migrations/20260809000002_fase2_kepanitiaan_dan_seed_bucket.sql` (dijalankan setelah migration Fase 1). Isinya dua bagian:
1. Fungsi `public.seed_default_buckets()` + trigger `trg_seed_default_buckets` (`after insert on kepanitiaan_site`) yang otomatis insert 6 baris `buckets` (nama & `is_budgeting` sesuai section 5 HANDOVER.md) setiap kali instance `kepanitiaan_site` baru dibuat. Sengaja **bukan** `security definer` — trigger jalan dengan privilege pemanggil (leader), dan policy `buckets_scoped` Fase 1 sudah mengizinkan leader insert lewat `is_leader()`, jadi tidak perlu bypass RLS.
2. Fungsi RPC `public.create_kepanitiaan_dengan_sites(p_nama text, p_nama_sites text[])`: insert 1 baris `kepanitiaan`, lalu untuk setiap nama site di array — find-or-create ke tabel `sites` by `nama_site` (karena tabel `sites` belum punya halaman CRUD terpisah, lihat poin di bawah), lalu insert `kepanitiaan_site` (`on conflict do nothing` untuk idempotensi). Juga **bukan** `security definer`, jadi RLS (`kepanitiaan_write_leader`, `sites_write_leader`, `kepanitiaan_site_write_leader`) tetap berlaku otomatis berdasarkan role pemanggil — panggilan dari akun panitia akan gagal dengan error RLS, bukan lewat pengecekan manual di kode. Ditambahkan `grant execute ... to authenticated` supaya bisa dipanggil lewat `supabase.rpc()` dari sisi aplikasi.

**Keputusan: tidak ada halaman CRUD terpisah untuk tabel `sites`.** HANDOVER.md section 5-6 tidak menugaskan pengelolaan `sites` ke fase manapun secara eksplisit, tapi form "Buat Kepanitiaan Baru" butuh sumber data site. Solusi minimal yang dipilih: form punya checkbox untuk site yang sudah ada (query `select * from sites`) **dan** input teks "tambah site baru" (dipisah koma/baris baru) yang di-find-or-create otomatis lewat RPC di atas. Ini bukan fitur baru di luar scope — cuma cara mengisi tabel `sites` yang sudah ada di model data Fase 1 — tapi dicatat di sini supaya jelas kalau nanti section 5/6 diperluas dengan halaman manajemen site sendiri, keputusan ini harus direvisit.

**Struktur route baru**:
- `/leader/kepanitiaan` — daftar kepanitiaan (dikelompokkan per nama), tiap kepanitiaan menampilkan tombol per instance site-nya. Tombol "+ Buat Kepanitiaan Baru".
- `/leader/kepanitiaan/baru` — form buat kepanitiaan (client component `create-kepanitiaan-form.tsx` pakai `useActionState`, mengikuti pola `login-form.tsx` Fase 1).
- `/leader/kepanitiaan/[instanceId]` — detail satu instance `kepanitiaan_site`: daftar bucket (read-only, cuma untuk membuktikan auto-seed jalan — CRUD tugas per bucket itu scope Fase 4) + CRUD susunan panitia.
- `/panitia/susunan` — halaman susunan panitia milik akun panitia sendiri, `kepanitiaan_site_id` di-resolve dari `public.users` di server (bukan dari input), supaya panitia tidak bisa lihat/edit instance lain (RLS `committee_members_scoped` juga menahan ini sebagai lapis kedua).

Kedua halaman susunan panitia (leader & panitia) memakai komponen bersama `components/committee/committee-members-section.tsx` (Server Component, bukan client) — tiap baris anggota adalah `<form>` sendiri (bukan toggle edit-mode) yang langsung menampilkan input ter-isi nilai sekarang + tombol "Simpan" dan `<form>` "Hapus" di sampingnya, jadi keseluruhan CRUD **tidak butuh client-side JS sama sekali** kecuali form create-kepanitiaan (yang butuh `useActionState` untuk pesan error).

**Server actions**: `lib/kepanitiaan/actions.ts` (`createKepanitiaan`, panggil RPC di atas) dan `lib/committee/actions.ts` (`addCommitteeMember`/`updateCommitteeMember`/`deleteCommitteeMember`). Argumen seperti `kepanitiaanSiteId`/`memberId`/`redirectTo` di-pass lewat `.bind(null, ...)` dari Server Component (bukan hidden input) — sesuai `node_modules/next/dist/docs/01-app/02-guides/forms.md`, argumen yang di-bind ke Server Action terenkripsi di closure dan tidak bisa ditempel/diubah dari sisi client, jadi ini lebih aman daripada hidden input untuk kasus di mana panitia seharusnya tidak bisa mengubah `kepanitiaan_site_id` tujuan insert. Error ditampilkan lewat redirect ke `?error=...` di URL yang sama (dibaca lewat `searchParams`), bukan `useActionState`, karena form-form ini Server Component murni.

**Role anggota panitia** (`committee_members.role`) dipilih lewat elemen `<select>` HTML biasa (bergaya mengikuti `input.tsx`), bukan komponen shadcn `Select` — cuma 2 pilihan tetap (`anggota`/`leader_bidang`), jadi membuat komponen Radix Select baru (butuh dependency `@radix-ui/react-select` baru) dianggap berlebihan untuk kebutuhan ini. Kalau butuh dropdown custom-styled di fase lain, ikuti pola manual `label.tsx` untuk bikin `components/ui/select.tsx`.

**Migration lanjutan `20260809000003_fase2_tambah_site_ke_kepanitiaan_existing.sql`** (dibuat saat verifikasi live, `create or replace` atas RPC di migration `...0002`): versi pertama RPC selalu `insert` baris baru ke `kepanitiaan`, jadi submit nama yang sudah terpakai langsung kena unique constraint dan gagal dengan "Nama kepanitiaan ini sudah dipakai". Efek praktisnya fatal — satu-satunya cara menambah site ke kepanitiaan yang sudah berjalan (misal FIND yang tadinya 2 site lalu buka di Jakarta-Area) adalah hapus + bikin ulang, yang ikut menghapus susunan panitia & bucket yang sudah diisi. Diperbaiki jadi find-or-create untuk `kepanitiaan`, sama persis dengan pola yang sudah dipakai untuk `sites` di function yang sama; insert ke `kepanitiaan_site` tetap `on conflict do nothing`, jadi submit ulang kombinasi kepanitiaan+site yang sudah ada = no-op (tidak bikin instance ganda maupun bucket dobel). Konsekuensi yang disadari: proteksi duplikat nama hilang, jadi typo nama (misal "FIND " vs "FIND") bisa diam-diam menambah site ke kepanitiaan yang salah — `trim()` sudah dipasang untuk kasus spasi, tapi kalau nanti daftar kepanitiaan sudah banyak, pertimbangkan ganti input teks bebas jadi dropdown "pilih kepanitiaan yang sudah ada / buat baru". Halaman & tombolnya ikut diganti jadi "Buat Kepanitiaan / Tambah Site" supaya perilaku ini jelas ke leader.

**Rename & delete kepanitiaan/instance** (diminta Yolanda saat verifikasi live, tidak ada di rincian section 6 tapi masih di dalam judul fase "Manajemen Kepanitiaan"): di `/leader/kepanitiaan` tiap card punya input nama yang bisa diedit + tombol "Simpan Nama", dan tombol "Hapus Kepanitiaan" (menghapus kepanitiaan beserta semua instance site-nya lewat `on delete cascade`). Di halaman detail instance ada tombol "Hapus Instance Ini" yang hanya menghapus satu kombinasi kepanitiaan+site. Pemicunya: waktu verifikasi, satu-satunya cara menghapus kepanitiaan adalah `delete from` manual di SQL Editor — tidak masuk akal untuk dipakai leader sehari-hari.
- Aksi hapus pakai `components/confirm-submit-button.tsx` (client component tipis, `window.confirm()` lalu `preventDefault()` kalau dibatalkan). Kalau JS mati tombolnya tetap jadi submit biasa, jadi form-nya tidak rusak.
- Sebelum menghapus, action mengecek dulu jumlah akun di `public.users` yang `kepanitiaan_site_id`-nya menunjuk ke instance yang mau dihapus. Kalau masih ada, hapus **ditolak** dengan pesan yang jelas, bukan dilempar sebagai error database. Alasannya: FK `users.kepanitiaan_site_id` itu `on delete set null`, tapi check constraint `panitia_harus_punya_instance` melarang panitia punya `kepanitiaan_site_id` null — jadi delete-nya pasti gagal di level DB dengan pesan yang tidak bisa dibaca leader. Menghapus akun panitia secara otomatis sengaja **tidak** dilakukan (akun auth itu milik orang sungguhan; keputusan hapus/pindah akun harus disengaja, bukan efek samping hapus kepanitiaan).

**Verifikasi live sudah dilakukan Yolanda (bukan dari sandbox), hasilnya sukses:** kedua migration Fase 2 sudah dijalankan lewat Supabase Dashboard > SQL Editor, form buat kepanitiaan berhasil membuat instance baru, tiap instance otomatis dapat 6 bucket default (termasuk Budgeting bertanda `is_budgeting`), dan CRUD susunan panitia (tambah anggota) berjalan normal.

**Kendala yang muncul saat verifikasi live** (dicatat supaya fase berikutnya tidak mengulang):
- **`delete from public.users where email like '%@test.local'` mengunci akun sendiri.** Perintah ini dipakai untuk membersihkan user test yang menghalangi `delete from kepanitiaan` (constraint `panitia_harus_punya_instance` menolak `on delete set null` selama masih ada panitia yang nempel ke instance itu), tapi ikut menghapus `leader@test.local` yang sedang dipakai login. Akibatnya login jadi gagal dengan pesan "Akun ini belum terdaftar di sistem orientasi panitia" — baris `auth.users` masih ada (password tetap diterima) tapi baris `public.users`-nya hilang. Pulihkan dengan `insert into public.users (id, email, role, kepanitiaan_site_id) select id, email, 'leader', null from auth.users where email = '<email>' on conflict (id) do update set role = 'leader', kepanitiaan_site_id = null;`. Pelajaran: hapus user test dengan filter yang spesifik ke instance yang mau dibuang, jangan sapu semua `@test.local`.
- **`rm -rf` tidak jalan di Windows PowerShell/CMD**, dan `npm` di PowerShell bisa kena `running scripts is disabled on this system` (execution policy laptop kantor) — pakai **Command Prompt**, bukan PowerShell. Untuk hapus cache build, hapus folder `.next` manual lewat File Explorer.
- **Server dev lama sering nyangkut di port 3000** setelah beberapa kali restart, bikin halaman lambat/`Failed to fetch` walau kodenya sudah benar. Next.js akan bilang "Another next dev server is already running" + kasih PID-nya; matikan dengan `taskkill /PID <pid> /F` lalu `npm run dev` lagi.

**Belum diverifikasi live**: RLS `committee_members_scoped` belum diuji ulang khusus untuk flow tambah/edit/hapus anggota dari dua akun panitia berbeda (Fase 1 hanya menguji isolasi di tabel `buckets`), dan halaman `/panitia/susunan` belum pernah dibuka dengan akun panitia sungguhan karena akun test-nya sudah dihapus. Langkah manualnya ada di `supabase/verify_fase2.sql` poin 7-8 — layak dikerjakan di awal Fase 3 kalau nanti bikin akun panitia baru.

### Fase 3 — Timeline Pelaksanaan

**Tidak ada migration SQL baru di fase ini.** Tabel `timeline_milestones` dan policy `timeline_milestones_scoped` (pola `is_leader() OR kepanitiaan_site_id = current_user_kepanitiaan_site_id()`, sama seperti `buckets`/`committee_members`) sudah dibuat dari migration Fase 1 (`20260809000001_fase1_schema_and_rls.sql`) tapi belum pernah dipakai UI-nya sampai fase ini. Karena RLS-nya sudah ada dan sudah mengikuti pola yang sama-sama dipakai `buckets` (yang sudah teruji isolasinya di Fase 1), Fase 3 murni kerja UI — tidak menyentuh skema/RLS sama sekali.

**Komponen & actions baru**, mengikuti pola `committee-members-section.tsx`/`lib/committee/actions.ts` dari Fase 2 persis:
- `lib/timeline/actions.ts`: `addMilestone`/`updateMilestone`/`deleteMilestone`. Validasi tambahan yang tidak ada di pola committee: `tanggal_selesai` (opsional) ditolak dengan pesan error kalau lebih awal dari `tanggal_mulai` (perbandingan string ISO `yyyy-mm-dd`, aman karena format `<input type="date">` selalu ISO).
- `components/timeline/timeline-section.tsx` (`TimelineSection`, dipakai leader & panitia): render "vertical timeline sederhana" — list milestone diurutkan ascending by `tanggal_mulai` (di-sort di komponen, bukan query, supaya konsisten walau data belum di-`order()` dengan benar dari pemanggil), tiap item punya dot + garis vertikal di kolom kiri (garis di-skip untuk item terakhir) dan card form edit di kanan (pola form-per-baris yang sama seperti committee members: tidak butuh client-side JS). Form tambah milestone baru di bagian bawah, sama seperti bucket committee.

**Halaman**:
- Leader: **tidak dibuat route baru** — `TimelineSection` di-inline langsung ke `/leader/kepanitiaan/[instanceId]/page.tsx` (di atas `CommitteeMembersSection`), mengikuti pola halaman detail instance Fase 2 yang sudah menumpuk beberapa section (bucket read-only + committee) di satu halaman. Kalau nanti halaman ini kepanjangan setelah Fase 4/5 nambah section lagi, pertimbangkan pecah jadi tab/sub-route.
- Panitia: dibuat route baru `/panitia/timeline`, isinya sama persis strukturnya dengan `/panitia/susunan` (resolve `kepanitiaan_site_id` dari `public.users` di server, bukan dari input, supaya panitia tidak bisa akses instance lain — RLS `timeline_milestones_scoped` jadi lapis kedua). Link ke halaman ini ditambahkan di `/panitia/dashboard`.

**Verifikasi yang sudah dilakukan (di sandbox, bukan live)**: `npm install` (registry npm tidak diblokir, sama seperti Fase 2), `next build`, `next lint`, `tsc --noEmit` — semua sukses dengan `.env.local` placeholder sementara (dihapus lagi sebelum commit, tidak pernah masuk git, sama seperti pola Fase 2). Koneksi nyata ke Supabase tetap tidak bisa dites dari sandbox ini.

**Status verifikasi live**: Yolanda sudah pakai halaman Timeline secara langsung (tambah milestone, coba tab Vertikal & Mingguan, lihat badge status, konfirmasi Gantt chart tampil benar setelah bugfix drift tanggal). Yang **belum secara eksplisit dikonfirmasi ulang** di sesi ini (jadi masih berstatus asumsi, walau risikonya rendah karena mengikuti pola RLS `is_leader() OR kepanitiaan_site_id = current_user_kepanitiaan_site_id()` yang sama seperti `buckets`/`committee_members` yang sudah teruji isolasinya sejak Fase 1):
1. Independensi timeline antar-instance (FIND@Cibitung vs FIND@Jakarta-Area) — ini kriteria "Selesai jika" resmi Fase 3 di section 6, belum ada langkah eksplisit di sesi ini yang menunjukkan kedua instance dibuka berdampingan dan dibandingkan.
2. Isolasi RLS `timeline_milestones_scoped` dari sisi akun **panitia** (login sebagai panitia instance A, coba akses `/panitia/timeline`, pastikan tidak lihat data instance B) — sejauh ini semua trial di sesi ini dilakukan dari akun leader.

Kalau mau benar-benar menutup celah ini sebelum Fase 4, langkah manualnya: buka 2 instance site berbeda dari kepanitiaan yang sama sebagai leader, isi milestone yang beda-beda, konfirmasi tidak tercampur; lalu login sebagai 1 akun panitia test dan cek `/panitia/timeline` cuma nampilin punya instance-nya sendiri. Kalau tidak sempat, boleh lanjut ke Fase 4 dulu dan cek ini belakangan — risikonya kecil karena pola RLS-nya identik dengan yang sudah terbukti aman di tabel lain.

**Revisi setelah review Yolanda** (4 permintaan, dikerjakan di sesi yang sama, sebelum verifikasi live pertama sempat dilakukan — jadi poin 1-4 di atas masih berlaku dan sekarang meliputi UI hasil revisi juga):

1. **Flag status milestone** (`lewat`/`berlangsung`/`akan_datang`) — dihitung murni di UI, tidak ada kolom status baru di `timeline_milestones` (statusnya derived, bukan disimpan). Helper di `lib/timeline/format.ts`: `getMilestoneStatus(tanggal_mulai, tanggal_selesai, todayIso)` bandingkan string ISO `yyyy-mm-dd` (aman secara leksikal). "Hari ini" dihitung lewat `todayJakartaISO()` yang mem-fix timezone ke `Asia/Jakarta` (bukan ikut timezone server yang defaultnya UTC di Vercel) — supaya status tidak salah geser di dini hari WIB. Badge-nya pakai komponen baru `components/ui/badge.tsx` (dibuat manual, pola sama seperti `button.tsx`/`card.tsx`, karena `ui.shadcn.com` masih terblokir) dengan varian `outline`/`default`/`muted` yang dipetakan ke 3 status lewat `STATUS_BADGE_VARIANT`/`STATUS_LABEL` — sengaja masih pakai token warna netral yang sudah ada (belum ada warna hijau/biru khusus di `globals.css`), biar tidak mendahului polish warna yang jadi scope Fase 8.
2. **Tampilan Mingguan** — toggle tab "Vertikal"/"Mingguan" di atas daftar milestone (tidak menghilangkan tampilan vertikal, cuma tambahan). **Revisi kedua: ini sekarang Gantt chart**, bukan list-per-minggu (opsi list-per-minggu adalah pilihan pertama Yolanda dari preview yang diajukan, tapi diganti lagi ke gaya grid/visual di revisi berikutnya begitu sudah dicoba live — jadi opsi list-per-minggu **sudah tidak dipakai lagi**, kalau lihat referensi lama di riwayat chat/kode jangan bingung). Implementasi Gantt di `components/timeline/timeline-gantt.tsx`: CSS Grid manual (bukan library chart, karena project ini tidak punya dependency chart apapun) — kolom = minggu (dari minggu paling awal sampai minggu paling akhir di antara semua milestone, dihitung lewat `buildGanttWeeks()` di `lib/timeline/format.ts`), baris = satu milestone per baris, tiap baris punya label nama di kolom pertama + "bar" berwarna yang di-span dari kolom minggu mulai sampai kolom minggu selesai (posisi bar diatur manual lewat inline style `gridRow`/`gridColumn`, **bukan** auto-placement CSS Grid, supaya tidak tergantung urutan render). Warna bar ikut status (`akan_datang`/`berlangsung`/`lewat`) pakai token warna netral yang sama seperti badge, plus ada legend kecil di bawah chart. **Gantt ini read-only** — tidak ada Edit/Hapus di tampilan ini, edit tetap lewat tab Vertikal. Chart-nya dibungkus `overflow-x-auto` supaya tidak merusak layout kalau minggunya banyak (scroll horizontal di dalam card, bukan di halaman).
3. **Milestone tersimpan di-lock, klik Edit untuk ubah** — ini yang bikin section timeline butuh client-side JS (beda dari susunan panitia yang sengaja tanpa JS): `components/timeline/milestone-row.tsx` (`"use client"`) simpan state `isEditing` lokal. Mode tampilan (default): nama + ikon gembok (`Lock` dari `lucide-react`, sudah jadi dependency dari Fase 0) + badge status + rentang tanggal sebagai teks biasa (tidak ada `<input>` sama sekali, jadi tanggal benar-benar tidak bisa diketik langsung) + tombol "Edit"/"Hapus". Mode edit: form biasa (persis versi lama) + tombol "Simpan"/"Batal". "Simpan" memanggil server action `updateAction` **langsung sebagai function call** dari `action={handleSave}` (bukan cuma taruh referensi server action di `action=` form attribute), lalu `setIsEditing(false)` sesudahnya — pola ini (server action dipanggil imperatif dari client, error tetap lempar lewat `redirect()` yang otomatis di-handle Next.js sebagai client-side navigation) belum pernah dipakai di codebase ini sebelumnya, jadi kalau ada pola serupa dibutuhkan di fase lain (misal Fase 4 kalau butuh perilaku sama di CRUD tugas), ikuti contoh di sini. Ini cuma berlaku di tab Vertikal — tab Mingguan (Gantt) read-only, lihat poin 2.
   - Struktur jadi 4 lapis: `TimelineSection` (server, fetch & bind action, render Card + form tambah) → `TimelineBody` (`"use client"`, pegang state tab Vertikal/Mingguan) → `MilestoneRow` (`"use client"`, pegang state edit per baris, dipakai tab Vertikal) / `TimelineGantt` (dipakai tab Mingguan, tidak butuh state sendiri). Kalau butuh nambah kolom milestone baru, edit di 3 tempat minimal: `Milestone` type (`timeline-section.tsx`), form field di `MilestoneRow`, dan kolom di query Supabase pemanggil halaman — plus `TimelineGantt`/`buildGanttWeeks` kalau kolom barunya relevan ditampilkan di Gantt juga.
4. **Leader Bidang bisa pilih bidang** — field baru `committee_members.bucket_id` (nullable, FK ke `buckets.id`, `on delete set null`), ditambah lewat migration baru `20260809000004_fase3_committee_bucket_assignment.sql` (bukan bagian dari migration Fase 1, karena kolom ini memang belum ada saat itu). Selain kolom, migration ini juga nambah trigger `trg_check_committee_member_bucket_instance` yang memvalidasi `bucket_id` yang dipilih harus milik `kepanitiaan_site_id` yang sama dengan baris `committee_members`-nya — defense-in-depth di level DB, karena UI cuma menawarkan pilihan bucket dari instance yang benar tapi tidak ada yang mencegah request manual langsung ke Supabase REST API mengisi `bucket_id` dari instance lain.
   - Dropdown "Bidang" **selalu ditampilkan di form** (kecuali kalau instance-nya kebetulan belum punya bucket sama sekali — dijaga lewat `buckets.length > 0`, walau praktiknya harusnya selalu ada karena 6 bucket default auto-seed), terlepas dari `role` yang dipilih — mengikuti prinsip section susunan panitia yang sengaja tidak butuh client-side JS. **Revisi kedua: opsi placeholder "- (bukan leader bidang)" dihapus** (permintaan Yolanda: sudah ada field Role yang membedakan anggota/leader_bidang, jadi dropdown Bidang tidak perlu punya cabang "kosong"-nya sendiri) — sekarang dropdown-nya selalu default ke bucket yang tersimpan (`member.bucket_id`) atau bucket pertama (`buckets[0].id`) kalau belum ada yang tersimpan. Validasinya tetap di server, bukan di tampilan: `lib/committee/actions.ts` punya helper `parseBucketId(role, value)` yang **selalu me-null-kan** `bucket_id` kalau `role !== "leader_bidang"` — jadi meskipun dropdown menunjukkan sebuah bucket terpilih untuk anggota biasa, nilai itu diabaikan sepenuhnya saat disimpan (murni kosmetik/tidak berarti apa-apa untuk role anggota), dan tidak ada `bucket_id` yang "nyangkut" kalau seseorang di-downgrade dari leader_bidang ke anggota.
   - Komponen `CommitteeMembersSection` sekarang butuh prop baru `buckets: { id, nama_bidang }[]` — kedua pemanggilnya (`/leader/kepanitiaan/[instanceId]/page.tsx` dan `/panitia/susunan/page.tsx`) sudah diupdate untuk fetch & pass ini (halaman panitia sebelumnya belum pernah query tabel `buckets` sama sekali, jadi ini query baru di halaman itu).
   - **Belum ada UI yang menampilkan "bidang siapa" di luar form CRUD ini** (misal daftar ringkas "Bidang Acara: Budi (leader), Sari (anggota)") — kalau nanti dibutuhkan, itu kemungkinan lebih pas ditaruh di halaman bucket Fase 4 (yang sudah punya konteks per-bidang), bukan di section susunan panitia ini.

**Tambahan langkah verifikasi live** untuk revisi di atas (di luar 4 poin sebelumnya):
5. Jalankan migration baru `20260809000004_fase3_committee_bucket_assignment.sql` lewat Supabase Dashboard > SQL Editor (setelah migration `...0001`-`...0003`).
6. Di form tambah/edit anggota panitia, pilih role "Leader Bidang" + pilih salah satu bidang di dropdown "Bidang" — simpan, refresh halaman, pastikan pilihan bidangnya tetap tersimpan (dropdown menunjukkan bucket yang benar sebagai default).
7. Ubah role anggota yang sudah punya bidang balik ke "Anggota" — simpan — pastikan `bucket_id`-nya ikut hilang (buka lagi form-nya, seharusnya `bucket_id` di database jadi `null` walau dropdown-nya tampil menunjukkan salah satu bucket — ini kosmetik yang disengaja, lihat poin 4 di atas).
8. Di card Timeline, klik tab "Vertikal": coba "Edit" pada satu milestone, ubah tanggal, "Simpan" — pastikan baris otomatis balik ke mode terkunci (bukan tetap dalam mode form). Cek juga badge status berubah otomatis sesuai tanggal hari ini (misal buat milestone dengan `tanggal_mulai` besok vs hari ini vs kemarin, badgenya harus beda: "Akan Datang"/"Berlangsung"/"Sudah Lewat").
9. Klik tab "Mingguan" — pastikan muncul Gantt chart: nama milestone di kiri, bar berwarna sesuai statusnya di kanan, span kolom minggunya sesuai `tanggal_mulai`-`tanggal_selesai`. Coba dengan milestone yang rentangnya beberapa minggu (misal 3 minggu) — bar-nya harus nyambung memanjang, bukan putus-putus. Kalau ada banyak milestone dengan tanggal yang jauh terpisah (misal satu di Agustus, satu di Desember), cek juga chart-nya tetap bisa di-scroll ke kanan (tidak merusak layout halaman).

**Revisi ketiga — hapus bucket "Penetapan Susunan Kepanitiaan" dari default seed** (bukan bucket/bidang, harusnya jadi tugas di dalam bucket lain — keputusan konten, bukan bug): migration baru `20260809000005_fase3_hapus_bucket_penetapan_susunan.sql` mengubah `seed_default_buckets()` (`create or replace`, definisi lama di migration `...0002` jadi usang tapi filenya sengaja tidak diedit — konsisten dengan pola "jangan ubah migration lama, tambah migration baru" yang sudah dipakai di Fase 2 untuk RPC serupa) supaya instance baru ke depan cuma dapat 5 bucket default (lihat section 5 yang sudah diupdate). Migration ini juga langsung `delete` baris bucket "Penetapan Susunan Kepanitiaan" yang sudah ke-seed di instance-instance yang sudah ada (idempotent, aman dijalankan berkali-kali). Efek sampingnya otomatis lewat FK yang sudah ada dari Fase 1/3: `committee_members.bucket_id` yang kebetulan menunjuk bucket ini jadi `null` (on delete set null), dan task/subtask di dalamnya (kemungkinan besar belum ada karena Fase 4 belum berjalan) ikut terhapus (on delete cascade). **Tidak ada perubahan kode aplikasi** untuk revisi ini — nama bucket tidak pernah di-hardcode di UI, cuma ditampilkan apa adanya dari hasil query, jadi cukup jalankan migration-nya saja.

**Tambahan langkah verifikasi**:
10. Jalankan migration `20260809000005_fase3_hapus_bucket_penetapan_susunan.sql` lewat Supabase Dashboard > SQL Editor.
11. Buka instance yang sudah ada (misal FIND@Cibitung) — card "Bucket Kepanitiaan" harus tinggal 5 bucket, tidak ada lagi "Penetapan Susunan Kepanitiaan".
12. Buat kepanitiaan baru (atau tambah site baru ke kepanitiaan yang sudah ada) — instance barunya harus langsung ter-seed 5 bucket, bukan 6.

**Bugfix — posisi bar di Gantt chart meleset** (dilaporkan Yolanda dari screenshot live: jarak antar label "Minggu 1/2/3" cuma 6 hari bukan 7, dan bar milestone yang lebih belakang di daftar tampil menimpa kolom nama-nya, bukan di kolom minggu yang benar). Root cause: `getWeekStart`/`addDays` di `lib/timeline/format.ts` memakai `date.toISOString().slice(0, 10)` untuk serialisasi tanggal — `toISOString()` mengonversi ke UTC dulu, jadi untuk timezone di depan UTC (WIB/WITA/WIT semuanya begitu) tanggalnya mundur 1 hari. Karena `buildGanttWeeks()` memanggil `addDays()` berantai (tiap kolom minggu dihitung dari kolom sebelumnya), error mundur-1-hari itu **menumpuk tiap iterasi** — kolom minggu ke-2 meleset 1 hari, ke-3 meleset 2 hari, dst — sampai akhirnya `findIndex` di `timeline-gantt.tsx` gagal mencocokkan minggu milestone yang lebih belakang dengan kolom yang benar (balik ke -1, yang bikin bar-nya dianggap mulai dari kolom 1 alias kolom nama, menimpa teks nama milestone-nya). Diperbaiki dengan helper baru `toLocalIso()` yang membangun string `yyyy-mm-dd` dari `getFullYear()`/`getMonth()`/`getDate()` (tetap di local time, tidak pernah round-trip ke UTC) — dipakai `getWeekStart` dan `addDays`. Tidak ada perubahan lain (tidak ada migration, tidak ada perubahan komponen) — murni perbaikan 1 fungsi helper. Sudah dicek manual di sandbox lewat simulasi Node dengan `TZ=Asia/Jakarta` yang mereproduksi persis tanggal buggy dari screenshot (`26 Jul`/`1 Agu`/`7 Agu`) sebelum fix, dan kelipatan 7 hari yang benar (`27 Jul`/`3 Agu`/`10 Agu`/...) sesudah fix. **Sudah dikonfirmasi live oleh Yolanda** — Gantt chart tampil benar setelah fix ini.
