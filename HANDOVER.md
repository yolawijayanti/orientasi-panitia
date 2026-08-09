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
- 6 bucket default di-seed otomatis setiap kali instance `kepanitiaan_site` baru dibuat: **Penetapan Susunan Kepanitiaan, Budgeting, Acara, Perlengkapan/Logistik/Transportasi, Publikasi dan Dokumentasi, Konsumsi**. Bucket "Budgeting" ditandai `is_budgeting = true` agar UI-nya menampilkan widget download-template + upload-submission (bukan cuma daftar tugas biasa). Panitia bisa tambah bucket custom lain (`is_default = false`).
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
- [x] Fase 2 — Manajemen Kepanitiaan & Susunan Panitia (kedua migration sudah dijalankan ke Supabase asli dan diverifikasi live oleh Yolanda: form leader bisa membuat kepanitiaan multi-site, tiap instance otomatis dapat 6 bucket default, menambah site ke kepanitiaan yang sudah ada juga jalan, dan CRUD susunan panitia berfungsi. Sisa yang belum diuji: isolasi RLS `committee_members` antar akun panitia + halaman `/panitia/susunan` dari sisi akun panitia — lihat `supabase/verify_fase2.sql` poin 7-8)
- [ ] Fase 3 — Timeline Pelaksanaan
- [ ] Fase 4 — Bucket Tugas & Breakdown
- [ ] Fase 5 — Download/Submit Template Budgeting
- [ ] Fase 6 — Dashboard Kepanitiaan (Leader)
- [ ] Fase 7 — Notifikasi
- [ ] Fase 8 — Polish Desain

**Fase berikutnya yang harus dikerjakan: Fase 3**

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
