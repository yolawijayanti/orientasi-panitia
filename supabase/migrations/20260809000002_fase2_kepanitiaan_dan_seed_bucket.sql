-- Fase 2: auto-seed 6 bucket default + RPC pembuatan kepanitiaan multi-site.
-- Jalankan lewat Supabase Dashboard > SQL Editor (setelah migration Fase 1),
-- atau `supabase db push` jika Supabase CLI sudah ter-link ke project. Sandbox
-- Claude Code tidak punya akses network ke *.supabase.co (lihat HANDOVER.md),
-- jadi migration ini perlu dijalankan manual oleh Yolanda.

-- =========================================================================
-- 1. Auto-seed 6 bucket default setiap kali instance kepanitiaan_site baru
--    dibuat (lihat section 5 HANDOVER.md untuk daftar bucket & aturan
--    is_budgeting). Bukan security definer: hanya leader yang boleh insert
--    ke kepanitiaan_site (lihat policy "kepanitiaan_site_write_leader" di
--    migration Fase 1), dan policy "buckets_scoped" juga mengizinkan leader
--    lewat is_leader(), jadi trigger ini otomatis lolos RLS di bawah role
--    yang sama tanpa perlu bypass privilege.
-- =========================================================================

create function public.seed_default_buckets()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.buckets (kepanitiaan_site_id, nama_bidang, is_default, is_budgeting)
  values
    (new.id, 'Penetapan Susunan Kepanitiaan', true, false),
    (new.id, 'Budgeting', true, true),
    (new.id, 'Acara', true, false),
    (new.id, 'Perlengkapan/Logistik/Transportasi', true, false),
    (new.id, 'Publikasi dan Dokumentasi', true, false),
    (new.id, 'Konsumsi', true, false);
  return new;
end;
$$;

create trigger trg_seed_default_buckets
after insert on public.kepanitiaan_site
for each row execute function public.seed_default_buckets();

-- =========================================================================
-- 2. RPC untuk form "buat kepanitiaan baru": bikin satu baris kepanitiaan,
--    lalu satu baris kepanitiaan_site per nama site yang dipilih/diketik
--    leader (find-or-create ke tabel sites by nama_site, karena tabel sites
--    belum punya halaman CRUD terpisah di scope MVP -- lihat HANDOVER.md
--    Catatan Teknis Fase 2). Bucket default ter-seed otomatis lewat trigger
--    di atas untuk setiap kepanitiaan_site yang baru terbuat.
--
--    Sengaja BUKAN security definer: berjalan dengan privilege pemanggil,
--    sehingga RLS ("kepanitiaan_write_leader", "sites_write_leader",
--    "kepanitiaan_site_write_leader") tetap berlaku -- pemanggil non-leader
--    otomatis gagal insert dengan error RLS, bukan lewat pengecekan manual.
-- =========================================================================

create function public.create_kepanitiaan_dengan_sites(
  p_nama text,
  p_nama_sites text[]
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_kepanitiaan_id uuid;
  v_site_id uuid;
  v_nama_site text;
begin
  insert into public.kepanitiaan (nama) values (p_nama)
  returning id into v_kepanitiaan_id;

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
