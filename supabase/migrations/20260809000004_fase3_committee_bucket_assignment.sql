-- Fase 3 (tambahan): leader_bidang bisa dipilihkan bidang (bucket) yang
-- dipimpin. Jalankan lewat Supabase Dashboard > SQL Editor setelah migration
-- Fase 1 & 2 (sandbox Claude Code tidak punya akses network ke *.supabase.co,
-- lihat HANDOVER.md).

alter table public.committee_members
  add column bucket_id uuid references public.buckets (id) on delete set null;

-- Defense in depth: pastikan bucket yang dipilih memang milik instance
-- kepanitiaan_site yang sama dengan anggota panitia-nya. UI hanya menawarkan
-- bucket dari instance yang benar, tapi divalidasi juga di level DB supaya
-- tidak bisa "diselundupkan" lewat request manual ke Supabase REST API.
create function public.check_committee_member_bucket_instance()
returns trigger
language plpgsql
as $$
begin
  if new.bucket_id is not null and not exists (
    select 1 from public.buckets
    where id = new.bucket_id
      and kepanitiaan_site_id = new.kepanitiaan_site_id
  ) then
    raise exception 'bucket_id harus berasal dari instance kepanitiaan_site yang sama dengan anggota panitia.';
  end if;
  return new;
end;
$$;

create trigger trg_check_committee_member_bucket_instance
  before insert or update on public.committee_members
  for each row execute function public.check_committee_member_bucket_instance();
