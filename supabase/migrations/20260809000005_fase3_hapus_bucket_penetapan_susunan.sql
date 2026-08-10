-- Fase 3 (revisi): "Penetapan Susunan Kepanitiaan" seharusnya jadi tugas
-- (task) di dalam bucket lain, bukan bucket/bidang tersendiri -- jadi
-- dihapus dari daftar bucket default. Jalankan lewat Supabase Dashboard >
-- SQL Editor setelah migration ...0001-...0004 (sandbox Claude Code tidak
-- punya akses network ke *.supabase.co, lihat HANDOVER.md).

-- 1. Update fungsi seed supaya instance BARU ke depannya cuma dapat 5
--    bucket default (bukan 6).
create or replace function public.seed_default_buckets()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.buckets (kepanitiaan_site_id, nama_bidang, is_default, is_budgeting)
  values
    (new.id, 'Budgeting', true, true),
    (new.id, 'Acara', true, false),
    (new.id, 'Perlengkapan/Logistik/Transportasi', true, false),
    (new.id, 'Publikasi dan Dokumentasi', true, false),
    (new.id, 'Konsumsi', true, false);
  return new;
end;
$$;

-- 2. Bersihkan bucket "Penetapan Susunan Kepanitiaan" yang sudah ke-seed di
--    instance yang SUDAH ada sebelum migration ini. Aman dijalankan ulang
--    (idempotent) -- kalau sudah tidak ada baris yang cocok, tidak ada efek.
--    committee_members.bucket_id yang kebetulan menunjuk ke bucket ini akan
--    otomatis jadi null (on delete set null); task/subtask di dalamnya
--    (kalau ada, seharusnya belum ada karena Fase 4 belum berjalan) akan
--    ikut terhapus (on delete cascade) -- cek dulu lewat query di bawah
--    sebelum menjalankan delete-nya kalau ragu.
delete from public.buckets
where nama_bidang = 'Penetapan Susunan Kepanitiaan'
  and is_default = true;
