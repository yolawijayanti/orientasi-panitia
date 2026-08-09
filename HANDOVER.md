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
- [x] Fase 1 — Auth & Skema Data (kode & migration SQL selesai, `next build`/lint/typecheck sukses; migration SQL dan uji RLS **belum dijalankan** ke Supabase asli karena sandbox tidak ada akses network — lihat Catatan Teknis Fase 1 untuk langkah manual yang perlu Yolanda jalankan)
- [ ] Fase 2 — Manajemen Kepanitiaan & Susunan Panitia
- [ ] Fase 3 — Timeline Pelaksanaan
- [ ] Fase 4 — Bucket Tugas & Breakdown
- [ ] Fase 5 — Download/Submit Template Budgeting
- [ ] Fase 6 — Dashboard Kepanitiaan (Leader)
- [ ] Fase 7 — Notifikasi
- [ ] Fase 8 — Polish Desain

**Fase berikutnya yang harus dikerjakan: Fase 2**

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

**Kendala network sama seperti Fase 0**: sandbox sesi ini (Claude Code remote execution environment) juga tidak punya akses ke `*.supabase.co` (dicoba `curl` ke project URL, hasilnya `403` dari proxy) maupun `ui.shadcn.com`. Jadi migration SQL, uji RLS, dan login sungguhan ke Supabase **belum diverifikasi live** — hanya diverifikasi lewat `npm run build`, `npm run lint`, typecheck, dan smoke test `next dev` (cek redirect proxy jalan, dan server action login tidak crash walau `signInWithPassword` gagal connect — dicek langsung: fetch gagal ke URL palsu tetap resolve sebagai `{error}`, tidak throw, jadi aman).

**Yang perlu Yolanda jalankan manual di sisi asli:**
1. Migration: `supabase/migrations/20260809000001_fase1_schema_and_rls.sql` — jalankan lewat Supabase Dashboard > SQL Editor (atau `supabase db push` kalau CLI sudah di-link).
2. Uji RLS: ikuti langkah-langkah di `supabase/verify_rls_fase1.sql` (buat 2 akun panitia test di 2 instance berbeda + 1 akun leader, lalu bandingkan hasil query `select * from buckets` dari masing-masing akun).
3. Isi `.env.local` seperti biasa, lalu `npm run dev`, coba login dengan salah satu akun test di atas, pastikan redirect ke `/panitia/dashboard` atau `/leader/dashboard` sesuai role.

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
