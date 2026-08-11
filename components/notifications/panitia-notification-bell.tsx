import { Suspense } from "react";

import { NotificationBell, NotificationBellSkeleton } from "@/components/notifications/notification-bell";
import { loadPanitiaNotifications } from "@/lib/notifications/feed";
import { countUnread, loadNotificationsSeenAt } from "@/lib/notifications/unread";
import { createClient } from "@/lib/supabase/server";

/** Sama alasannya seperti LeaderNotificationBellData -- dipisah supaya bisa dibungkus <Suspense>, tidak menahan render halaman. */
async function PanitiaNotificationBellData() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) return <NotificationBell notifications={[]} unreadCount={0} />;

  const { data: profile } = await supabase
    .from("users")
    .select("kepanitiaan_site_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  const kepanitiaanSiteId = profile?.kepanitiaan_site_id as string | null | undefined;

  const [notifications, seenAt] = await Promise.all([
    kepanitiaanSiteId
      ? loadPanitiaNotifications(supabase, kepanitiaanSiteId, authData.user.email)
      : Promise.resolve([]),
    loadNotificationsSeenAt(supabase, authData.user.id),
  ]);

  return (
    <NotificationBell notifications={notifications} unreadCount={countUnread(notifications, seenAt)} />
  );
}

/**
 * Dipasang satu baris dengan `PageNav` (Kembali/Home) di halaman panitia
 * yang punya PageNav, dan di samping LogoutButton untuk `/panitia/dashboard`
 * yang tidak punya PageNav. TIDAK lagi dipasang lewat
 * `app/(panitia)/layout.tsx` (dihapus) -- lihat alasan lengkap di
 * LeaderNotificationBell (komponen kembarannya untuk leader).
 */
export function PanitiaNotificationBell() {
  return (
    <Suspense fallback={<NotificationBellSkeleton />}>
      <PanitiaNotificationBellData />
    </Suspense>
  );
}
