-- Fase 7 (revisi 4): notifikasi "task_unassigned" -- pemberitahuan ke
-- assignee LAMA saat sebuah task/subtask dialihkan ke orang lain (atau
-- di-unassign jadi tanpa penanggung jawab), supaya orang itu tidak
-- menganggap tugas itu masih tanggung jawabnya.
--
-- Jalankan lewat Supabase Dashboard > SQL Editor setelah migration
-- 20260811000011.

alter table public.notifications_log
  drop constraint notifications_log_jenis_check;

alter table public.notifications_log
  add constraint notifications_log_jenis_check
  check (jenis in ('reminder_deadline', 'budget_lengkap', 'instance_selesai', 'task_assigned', 'task_unassigned'));
