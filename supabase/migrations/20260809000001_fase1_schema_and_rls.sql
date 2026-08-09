-- Fase 1: skema data inti + RLS.
-- Jalankan lewat Supabase Dashboard > SQL Editor, atau `supabase db push` jika
-- Supabase CLI sudah ter-link ke project. Sandbox Claude Code tidak punya akses
-- network ke *.supabase.co (lihat HANDOVER.md), jadi migration ini perlu
-- dijalankan manual oleh Yolanda.

create extension if not exists pgcrypto;

-- =========================================================================
-- 1. Tabel
-- =========================================================================

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  nama_site text not null unique,
  created_at timestamptz not null default now()
);

create table public.kepanitiaan (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  created_at timestamptz not null default now()
);

create table public.kepanitiaan_site (
  id uuid primary key default gen_random_uuid(),
  kepanitiaan_id uuid not null references public.kepanitiaan (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (kepanitiaan_id, site_id)
);

-- public.users.id = auth.users.id (satu row per akun panitia/leader).
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('panitia', 'leader')),
  kepanitiaan_site_id uuid references public.kepanitiaan_site (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint panitia_harus_punya_instance check (
    role = 'leader' or kepanitiaan_site_id is not null
  )
);

create table public.committee_members (
  id uuid primary key default gen_random_uuid(),
  kepanitiaan_site_id uuid not null references public.kepanitiaan_site (id) on delete cascade,
  nama text not null,
  email text,
  role text not null check (role in ('anggota', 'leader_bidang')),
  created_at timestamptz not null default now()
);

create table public.buckets (
  id uuid primary key default gen_random_uuid(),
  kepanitiaan_site_id uuid not null references public.kepanitiaan_site (id) on delete cascade,
  nama_bidang text not null,
  is_default boolean not null default false,
  is_budgeting boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  bucket_id uuid not null references public.buckets (id) on delete cascade,
  judul text not null,
  deadline date,
  status text not null default 'belum' check (status in ('belum', 'proses', 'selesai')),
  created_at timestamptz not null default now()
);

create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  judul text not null,
  deadline date,
  status text not null default 'belum' check (status in ('belum', 'proses', 'selesai')),
  created_at timestamptz not null default now()
);

create table public.timeline_milestones (
  id uuid primary key default gen_random_uuid(),
  kepanitiaan_site_id uuid not null references public.kepanitiaan_site (id) on delete cascade,
  nama_milestone text not null,
  tanggal_mulai date not null,
  tanggal_selesai date,
  created_at timestamptz not null default now()
);

create table public.budget_submissions (
  id uuid primary key default gen_random_uuid(),
  kepanitiaan_site_id uuid not null references public.kepanitiaan_site (id) on delete cascade,
  file_url text,
  status text not null default 'belum' check (status in ('belum', 'lengkap')),
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  kepanitiaan_site_id uuid not null references public.kepanitiaan_site (id) on delete cascade,
  jenis text not null,
  sent_at timestamptz not null default now()
);

-- =========================================================================
-- 2. Helper functions untuk RLS
--
-- security definer + search_path tetap agar function ini boleh membaca
-- public.users tanpa kena RLS-nya sendiri (mencegah infinite recursion saat
-- dipakai di dalam policy tabel users itu sendiri).
-- =========================================================================

create function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid();
$$;

create function public.current_user_kepanitiaan_site_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select kepanitiaan_site_id from public.users where id = auth.uid();
$$;

create function public.is_leader()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'leader', false);
$$;

-- =========================================================================
-- 3. Row Level Security
--
-- Aturan umum: akun leader akses semua baris; akun panitia hanya akses baris
-- yang terhubung ke kepanitiaan_site_id miliknya sendiri (langsung atau lewat
-- join ke buckets/tasks).
-- =========================================================================

alter table public.sites enable row level security;
alter table public.kepanitiaan enable row level security;
alter table public.kepanitiaan_site enable row level security;
alter table public.users enable row level security;
alter table public.committee_members enable row level security;
alter table public.buckets enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.timeline_milestones enable row level security;
alter table public.budget_submissions enable row level security;
alter table public.notifications_log enable row level security;

-- sites & kepanitiaan: tabel referensi, semua akun login boleh baca;
-- hanya leader yang boleh mengubah.
create policy "sites_select_authenticated" on public.sites
  for select to authenticated using (true);
create policy "sites_write_leader" on public.sites
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

create policy "kepanitiaan_select_authenticated" on public.kepanitiaan
  for select to authenticated using (true);
create policy "kepanitiaan_write_leader" on public.kepanitiaan
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- kepanitiaan_site: leader lihat semua instance, panitia hanya instance-nya.
create policy "kepanitiaan_site_select_own_or_leader" on public.kepanitiaan_site
  for select to authenticated
  using (public.is_leader() or id = public.current_user_kepanitiaan_site_id());
create policy "kepanitiaan_site_write_leader" on public.kepanitiaan_site
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- users: tiap akun lihat baris sendiri; leader lihat & kelola semua.
create policy "users_select_own_or_leader" on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_leader());
create policy "users_write_leader" on public.users
  for insert to authenticated with check (public.is_leader());
create policy "users_update_leader" on public.users
  for update to authenticated using (public.is_leader()) with check (public.is_leader());
create policy "users_delete_leader" on public.users
  for delete to authenticated using (public.is_leader());

-- Tabel operasional yang menempel langsung ke kepanitiaan_site_id.
create policy "committee_members_scoped" on public.committee_members
  for all to authenticated
  using (public.is_leader() or kepanitiaan_site_id = public.current_user_kepanitiaan_site_id())
  with check (public.is_leader() or kepanitiaan_site_id = public.current_user_kepanitiaan_site_id());

create policy "buckets_scoped" on public.buckets
  for all to authenticated
  using (public.is_leader() or kepanitiaan_site_id = public.current_user_kepanitiaan_site_id())
  with check (public.is_leader() or kepanitiaan_site_id = public.current_user_kepanitiaan_site_id());

create policy "timeline_milestones_scoped" on public.timeline_milestones
  for all to authenticated
  using (public.is_leader() or kepanitiaan_site_id = public.current_user_kepanitiaan_site_id())
  with check (public.is_leader() or kepanitiaan_site_id = public.current_user_kepanitiaan_site_id());

create policy "budget_submissions_scoped" on public.budget_submissions
  for all to authenticated
  using (public.is_leader() or kepanitiaan_site_id = public.current_user_kepanitiaan_site_id())
  with check (public.is_leader() or kepanitiaan_site_id = public.current_user_kepanitiaan_site_id());

create policy "notifications_log_scoped" on public.notifications_log
  for all to authenticated
  using (public.is_leader() or kepanitiaan_site_id = public.current_user_kepanitiaan_site_id())
  with check (public.is_leader() or kepanitiaan_site_id = public.current_user_kepanitiaan_site_id());

-- tasks: kepanitiaan_site_id-nya ada di buckets, jadi resolve lewat join.
create policy "tasks_scoped" on public.tasks
  for all to authenticated
  using (
    public.is_leader()
    or bucket_id in (
      select id from public.buckets
      where kepanitiaan_site_id = public.current_user_kepanitiaan_site_id()
    )
  )
  with check (
    public.is_leader()
    or bucket_id in (
      select id from public.buckets
      where kepanitiaan_site_id = public.current_user_kepanitiaan_site_id()
    )
  );

-- subtasks: resolve lewat tasks -> buckets.
create policy "subtasks_scoped" on public.subtasks
  for all to authenticated
  using (
    public.is_leader()
    or task_id in (
      select t.id from public.tasks t
      join public.buckets b on b.id = t.bucket_id
      where b.kepanitiaan_site_id = public.current_user_kepanitiaan_site_id()
    )
  )
  with check (
    public.is_leader()
    or task_id in (
      select t.id from public.tasks t
      join public.buckets b on b.id = t.bucket_id
      where b.kepanitiaan_site_id = public.current_user_kepanitiaan_site_id()
    )
  );
