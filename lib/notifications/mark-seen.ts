"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Dipanggil dari NotificationBell ("use client") saat dropdown dibuka --
 * panggilan imperatif langsung ke server action (pola sama seperti
 * `handleSave` di MilestoneRow, Fase 3), bukan lewat `<form action=...>`
 * karena tidak ada form apapun di sini, cuma tombol.
 *
 * RPC `mark_notifications_seen()` (migration Fase 7 revisi 3) yang
 * sesungguhnya menyentuh DB -- security definer, HANYA meng-update baris
 * `auth.uid()` sendiri, tidak menerima parameter id apapun. Ini perlu RPC
 * (bukan `.update()` langsung) karena policy `users_update_leader` (Fase 1)
 * cuma mengizinkan LEADER meng-update baris users, termasuk baris sendiri
 * milik panitia -- akun panitia tidak bisa UPDATE baris `users` lewat query
 * biasa sama sekali.
 */
export async function markNotificationsSeen() {
  const supabase = await createClient();
  await supabase.rpc("mark_notifications_seen");
}
