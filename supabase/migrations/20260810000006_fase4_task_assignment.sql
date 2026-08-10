-- Fase 4 (revisi): assign tugas/subtugas ke anggota panitia.
--
-- Jalankan lewat Supabase Dashboard > SQL Editor setelah migration
-- 20260809000001 s/d 20260809000005.
--
-- Tidak ada perubahan RLS di sini: policy `tasks_scoped`/`subtasks_scoped`
-- dari Fase 1 sudah membatasi baris mana yang boleh disentuh, dan kolom
-- assignee_id ikut terlindungi otomatis karena policy-nya berlaku per-baris,
-- bukan per-kolom.

-- =========================================================================
-- 1. Kolom assignee
-- =========================================================================
-- on delete set null (bukan cascade): menghapus anggota panitia tidak boleh
-- ikut menghapus tugasnya -- tugasnya cuma jadi belum-ada-penanggung-jawab.

alter table public.tasks
  add column if not exists assignee_id uuid
  references public.committee_members (id) on delete set null;

alter table public.subtasks
  add column if not exists assignee_id uuid
  references public.committee_members (id) on delete set null;

-- =========================================================================
-- 2. Validasi: assignee harus anggota di instance yang sama
--
-- Defense-in-depth di level DB, pola sama seperti trigger
-- trg_check_committee_member_bucket_instance di migration Fase 3: UI cuma
-- menawarkan anggota dari instance yang benar, tapi tidak ada yang mencegah
-- request manual ke Supabase REST API mengisi assignee_id dari instance lain.
-- =========================================================================

create or replace function public.check_task_assignee_instance()
returns trigger
language plpgsql
as $$
declare
  v_task_instance uuid;
  v_assignee_instance uuid;
begin
  if new.assignee_id is null then
    return new;
  end if;

  select b.kepanitiaan_site_id into v_task_instance
  from public.buckets b
  where b.id = new.bucket_id;

  select cm.kepanitiaan_site_id into v_assignee_instance
  from public.committee_members cm
  where cm.id = new.assignee_id;

  if v_task_instance is distinct from v_assignee_instance then
    raise exception 'Assignee harus anggota panitia di instance yang sama dengan tugasnya.';
  end if;

  return new;
end;
$$;

create or replace function public.check_subtask_assignee_instance()
returns trigger
language plpgsql
as $$
declare
  v_subtask_instance uuid;
  v_assignee_instance uuid;
begin
  if new.assignee_id is null then
    return new;
  end if;

  select b.kepanitiaan_site_id into v_subtask_instance
  from public.tasks t
  join public.buckets b on b.id = t.bucket_id
  where t.id = new.task_id;

  select cm.kepanitiaan_site_id into v_assignee_instance
  from public.committee_members cm
  where cm.id = new.assignee_id;

  if v_subtask_instance is distinct from v_assignee_instance then
    raise exception 'Assignee harus anggota panitia di instance yang sama dengan subtugasnya.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_task_assignee_instance on public.tasks;
create trigger trg_check_task_assignee_instance
  before insert or update of assignee_id, bucket_id on public.tasks
  for each row execute function public.check_task_assignee_instance();

drop trigger if exists trg_check_subtask_assignee_instance on public.subtasks;
create trigger trg_check_subtask_assignee_instance
  before insert or update of assignee_id, task_id on public.subtasks
  for each row execute function public.check_subtask_assignee_instance();
