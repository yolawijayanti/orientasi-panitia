import type { createClient } from "@/lib/supabase/server";
import type { NotificationItem } from "@/lib/notifications/feed";

/** `seenAt` null = akun ini belum pernah membuka lonceng sama sekali -- semua notifikasi dihitung belum dibaca. */
export function countUnread(notifications: NotificationItem[], seenAt: string | null): number {
  if (!seenAt) return notifications.length;
  return notifications.filter((notification) => notification.sentAt > seenAt).length;
}

/** RLS `users_select_own_or_leader` (Fase 1) mengizinkan tiap akun baca baris sendiri -- berlaku untuk leader maupun panitia. */
export async function loadNotificationsSeenAt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("notifications_seen_at")
    .eq("id", userId)
    .maybeSingle();

  return data?.notifications_seen_at ?? null;
}
