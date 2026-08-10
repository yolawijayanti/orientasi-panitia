-- Fase 7 (Notifikasi): tambahan minimal ke notifications_log supaya dedupe
-- notifikasi bisa dilakukan per-item (task/subtask) dan per-instance, plus
-- RPC baru supaya app server (cron reminder maupun server action event-based)
-- bisa cari alamat email leader untuk dikirimi notifikasi.
--
-- Jalankan lewat Supabase Dashboard > SQL Editor setelah migration
-- 20260809000001 s/d 20260810000009.

-- =========================================================================
-- 1. Kolom referensi + constrain nilai `jenis`
--
-- `jenis` sebelumnya dibiarkan text bebas (Fase 1) karena daftarnya belum
-- final -- sekarang sudah diputuskan ada 3 jenis notifikasi di Fase 7, jadi
-- di-constrain. `ref_type`/`ref_id` dipakai untuk dedupe: event-based
-- (budget_lengkap/instance_selesai) referensi ke kepanitiaan_site itu
-- sendiri; reminder_deadline referensi ke task/subtask spesifik yang
-- diingatkan (supaya reminder di-dedupe per-item per-hari, bukan cuma per
-- instance -- satu instance bisa punya banyak task jatuh tempo bersamaan).
-- =========================================================================

alter table public.notifications_log
  add column ref_type text,
  add column ref_id uuid;

alter table public.notifications_log
  add constraint notifications_log_jenis_check
  check (jenis in ('reminder_deadline', 'budget_lengkap', 'instance_selesai'));

-- =========================================================================
-- 2. RPC list_leader_emails()
--
-- Kenapa perlu RPC, bukan query langsung ke public.users: sama seperti
-- alasan list_akun_panitia_instance (migration Fase 4 ...0008) -- policy
-- "users_select_own_or_leader" cuma mengizinkan akun panitia lihat baris
-- sendiri, jadi tidak bisa SELECT baris leader untuk dapat alamat emailnya.
-- Beda dari list_akun_panitia_instance: RPC ini SENGAJA tidak dibatasi ke
-- instance pemanggil di WHERE clause -- siapapun yang login (panitia
-- maupun leader) MEMANG harus bisa memicu notifikasi ke leader saat mereka
-- menyelesaikan tugas/submit budget, jadi tidak ada gate otorisasi tambahan
-- di sini selain "harus akun terautentikasi" (lewat `grant ... to
-- authenticated`). Yang dikembalikan cuma alamat email leader, bukan data
-- sensitif lain.
-- =========================================================================

create function public.list_leader_emails()
returns setof text
language sql
security definer
set search_path = public
stable
as $$
  select email from public.users where role = 'leader';
$$;

grant execute on function public.list_leader_emails() to authenticated;
