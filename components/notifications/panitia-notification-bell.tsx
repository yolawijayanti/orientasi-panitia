import { Suspense } from "react";

import { NotificationBell, NotificationBellSkeleton } from "@/components/notifications/notification-bell";
import { loadPanitiaNotifications } from "@/lib/notifications/feed";
import { countUnread, loadNotificationsSeenAt } from "@/lib/notifications/unread";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

/**
 * Sama alasannya seperti LeaderNotificationBellData -- dipisah supaya
 * bisa dibungkus <Suspense>, tidak menahan render halaman. `getCurrentUser()`
 * (ber-`React.cache()`) dipakai supaya lookup auth+profile-nya SHARED
 * dengan pemanggil lain di request yang sama -- lihat lib/auth/current-user.ts.
 */
async function PanitiaNotificationBellData() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return <NotificationBell notifications={[]} unreadCount={0} />;

  const [notifications, seenAt] = await Promise.all([
    currentUser.kepanitiaanSiteId
      ? loadPanitiaNotifications(supabase, currentUser.kepanitiaanSiteId, currentUser.email)
      : Promise.resolve([]),
    loadNotificationsSeenAt(supabase, currentUser.id),
  ]);

  return (
    <NotificationBell notifications={notifications} unreadCount={countUnread(notifications, seenAt)} />
  );
}

/**
 * Dipasang di `app/(panitia)/layout.tsx`, di strip khusus di atas
 * `{children}` -- lihat komentar lengkap di `LeaderNotificationBell`
 * (komponen kembarannya untuk leader) untuk alasan posisinya.
 */
export function PanitiaNotificationBell() {
  return (
    <Suspense fallback={<NotificationBellSkeleton />}>
      <PanitiaNotificationBellData />
    </Suspense>
  );
}
