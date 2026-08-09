-- Fase 2 (lanjutan): izinkan menambah site ke kepanitiaan yang SUDAH ADA.
--
-- Versi pertama RPC (migration 20260809000002) selalu insert baris baru ke
-- public.kepanitiaan, jadi submit nama yang sudah terpakai langsung kena
-- unique constraint dan gagal. Akibatnya satu-satunya cara menambah site ke
-- kepanitiaan yang sudah jalan adalah hapus + bikin ulang -- yang ikut
-- menghapus susunan panitia & bucket yang sudah diisi. Tidak dipakai di
-- dunia nyata.
--
-- Perbaikannya: find-or-create untuk kepanitiaan, sama persis dengan pola
-- yang sudah dipakai untuk sites di dalam function yang sama. Insert ke
-- kepanitiaan_site tetap `on conflict do nothing`, jadi submit ulang
-- kombinasi kepanitiaan+site yang sudah ada = no-op (tidak bikin instance
-- ganda, tidak bikin bucket dobel).
--
-- Jalankan lewat Supabase Dashboard > SQL Editor setelah migration
-- 20260809000002.

create or replace function public.create_kepanitiaan_dengan_sites(
  p_nama text,
  p_nama_sites text[]
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_kepanitiaan_id uuid;
  v_nama_kepanitiaan text := trim(p_nama);
  v_site_id uuid;
  v_nama_site text;
begin
  select id into v_kepanitiaan_id
  from public.kepanitiaan
  where nama = v_nama_kepanitiaan;

  if v_kepanitiaan_id is null then
    insert into public.kepanitiaan (nama) values (v_nama_kepanitiaan)
    returning id into v_kepanitiaan_id;
  end if;

  foreach v_nama_site in array p_nama_sites
  loop
    v_nama_site := trim(v_nama_site);
    if v_nama_site = '' then
      continue;
    end if;

    select id into v_site_id from public.sites where nama_site = v_nama_site;
    if v_site_id is null then
      insert into public.sites (nama_site) values (v_nama_site)
      returning id into v_site_id;
    end if;

    insert into public.kepanitiaan_site (kepanitiaan_id, site_id)
    values (v_kepanitiaan_id, v_site_id)
    on conflict (kepanitiaan_id, site_id) do nothing;
  end loop;

  return v_kepanitiaan_id;
end;
$$;

grant execute on function public.create_kepanitiaan_dengan_sites(text, text[]) to authenticated;
