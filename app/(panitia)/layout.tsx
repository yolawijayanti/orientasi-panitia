import { NotificationBell } from "@/components/notifications/notification-bell";
import { loadPanitiaNotifications } from "@/lib/notifications/feed";
import { countUnread, loadNotificationsSeenAt } from "@/lib/notifications/unread";
import { createClient } from "@/lib/supabase/server";

/**
 * Sama seperti app/(leader)/layout.tsx, tapi untuk panitia. Notifikasinya
 * personal (reminder_deadline/task_assigned dicocokkan ke akun ini lewat
 * email, lihat lib/notifications/feed.ts) + broadcast instance sendiri
 * (budget_lengkap/instance_selesai) -- BUKAN cross-instance seperti
 * leader, karena panitia memang cuma terikat ke 1 instance.
 */
export default async function PanitiaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return <>{children}</>;
  }

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
    <div className="flex min-h-full flex-col">
      <div className="flex justify-end border-b p-3">
        <NotificationBell notifications={notifications} unreadCount={countUnread(notifications, seenAt)} />
      </div>
      {children}
    </div>
  );
}
