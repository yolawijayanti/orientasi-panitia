-- Fase 7 (revisi 3): badge counter notifikasi + notifikasi tambahan
-- (task_assigned, dan budget_lengkap/instance_selesai yang sekarang juga
-- ditujukan ke SELURUH panitia di instance, bukan cuma leader).
--
-- Jalankan lewat Supabase Dashboard > SQL Editor setelah migration
-- 20260810000010.

-- =========================================================================
-- 1. Badge counter -- "kapan terakhir akun ini melihat notifikasinya"
--
-- Satu kolom timestamp per akun (leader maupun panitia) -- unread count
-- dihitung di kode aplikasi sebagai "notifikasi yang sent_at-nya lebih baru
-- dari notifications_seen_at" (null dihitung sebagai belum pernah lihat
-- sama sekali, jadi semua notifikasi lama-lama dianggap belum dibaca kalau
-- akun itu belum pernah membuka lonceng-nya).
-- =========================================================================

alter table public.users
  add column notifications_seen_at timestamptz;

-- RPC (bukan UPDATE langsung dari client) supaya panitia bisa menandai
-- notifikasinya SENDIRI sudah dilihat -- policy "users_update_leader" dari
-- Fase 1 cuma mengizinkan LEADER meng-update baris users manapun (termasuk
-- baris sendiri), akun panitia tidak bisa UPDATE baris users sama sekali,
-- termasuk baris miliknya sendiri. RPC ini security definer supaya bisa
-- bypass itu, TAPI cuma menyentuh baris `auth.uid()` sendiri (hardcoded di
-- WHERE clause, tidak menerima parameter id sama sekali) -- jadi tidak ada
-- akun yang bisa menandai baris akun lain.
create function public.mark_notifications_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.users set notifications_seen_at = now() where id = auth.uid();
$$;

grant execute on function public.mark_notifications_seen() to authenticated;

-- =========================================================================
-- 2. Kolom penerima personal + jenis baru "task_assigned"
--
-- reminder_deadline dan task_assigned itu personal (1 assignee spesifik),
-- beda dari budget_lengkap/instance_selesai yang broadcast ke satu instance
-- (leader + seluruh panitia instance itu). recipient_committee_member_id
-- dicatat SAAT notifikasi dikirim (denormalized) supaya feed personal
-- panitia bisa difilter tanpa join ulang ke tasks/subtasks yang bisa saja
-- sudah di-reassign/dihapus belakangan -- riwayat "notifikasi ini dulu
-- dikirim ke siapa" tetap akurat apapun yang terjadi sesudahnya.
-- =========================================================================

alter table public.notifications_log
  add column recipient_committee_member_id uuid references public.committee_members (id) on delete set null;

alter table public.notifications_log
  drop constraint notifications_log_jenis_check;

alter table public.notifications_log
  add constraint notifications_log_jenis_check
  check (jenis in ('reminder_deadline', 'budget_lengkap', 'instance_selesai', 'task_assigned'));
