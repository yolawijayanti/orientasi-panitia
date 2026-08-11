import { NotificationBell } from "@/components/notifications/notification-bell";
import { loadLeaderNotifications } from "@/lib/notifications/feed";
import { countUnread, loadNotificationsSeenAt } from "@/lib/notifications/unread";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout bersama PERTAMA di aplikasi ini (sebelumnya tiap halaman leader
 * punya headernya sendiri-sendiri, tidak ada elemen bersama antar
 * halaman) -- dibuat khusus supaya tombol lonceng notifikasi bisa muncul
 * di SEMUA halaman leader, bukan cuma /leader/dashboard. Sengaja tidak
 * menyentuh header masing-masing halaman (H1, LogoutButton, dst) yang
 * sudah ada -- cuma menambah 1 strip tipis di atasnya.
 */
export default async function LeaderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const [notifications, seenAt] = await Promise.all([
    loadLeaderNotifications(supabase),
    authData.user ? loadNotificationsSeenAt(supabase, authData.user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex justify-end border-b p-3">
        <NotificationBell notifications={notifications} unreadCount={countUnread(notifications, seenAt)} />
      </div>
      {children}
    </div>
  );
}
