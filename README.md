# orientasi-panitia

Aplikasi web internal untuk mengelola kepanitiaan event (susunan panitia, timeline, bucket tugas, budgeting, dan dashboard leader). Lihat [HANDOVER.md](./HANDOVER.md) untuk konteks produk lengkap dan roadmap tiap fase.

## Tech Stack

- Next.js (App Router) + TypeScript
- Supabase (Postgres, Auth, Storage, RLS)
- Tailwind CSS + shadcn/ui

## Getting Started

1. Salin `.env.local.example` menjadi `.env.local` dan isi kredensial Supabase project kamu.
2. Install dependencies dan jalankan dev server:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Folder

- `app/(auth)` — halaman login/auth
- `app/(panitia)` — halaman untuk akun panitia
- `app/(leader)` — halaman untuk akun leader
- `lib/supabase` — client & helper Supabase
