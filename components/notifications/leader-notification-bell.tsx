import { Suspense } from "react";

import { NotificationBell, NotificationBellSkeleton } from "@/components/notifications/notification-bell";
import { loadLeaderNotifications } from "@/lib/notifications/feed";
import { countUnread, loadNotificationsSeenAt } from "@/lib/notifications/unread";
import { createClient } from "@/lib/supabase/server";

/**
 * Async Server Component -- data-fetching-nya SENGAJA dipisah dari
 * `LeaderNotificationBell` (default export di bawah) supaya bisa
 * dibungkus <Suspense>. Kalau di-await LANGSUNG di komponen yang dirender
 * sejajar dengan konten halaman (versi Revisi 2/3 sebelumnya, taruh di
 * app/(leader)/layout.tsx), seluruh render halaman ikut ketahan menunggu
 * query ini selesai -- ini pola yang secara eksplisit diperingatkan di
 * dokumentasi Next.js (`node_modules/next/dist/docs/01-app/02-guides/
 * authentication.md`, bagian "Auth checks in shared layouts"): "A
 * top-level await on ... the DAL in a layout delays the first streamed
 * chunk for that segment." Efek nyatanya: navigasi antar halaman leader
 * jadi lambat begitu fitur notifikasi ditambah (dilaporkan Yolanda
 * sebagai tombol yang "tidak merespon" -- root cause-nya lambat, bukan
 * benar-benar macet).
 */
async function LeaderNotificationBellData() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const [notifications, seenAt] = await Promise.all([
    loadLeaderNotifications(supabase),
    authData.user ? loadNotificationsSeenAt(supabase, authData.user.id) : Promise.resolve(null),
  ]);

  return (
    <NotificationBell notifications={notifications} unreadCount={countUnread(notifications, seenAt)} />
  );
}

/**
 * Dipasang satu baris dengan `PageNav` (Kembali/Home) di tiap halaman
 * leader yang punya PageNav, dan di samping LogoutButton untuk
 * `/leader/dashboard` yang tidak punya PageNav. TIDAK lagi dipasang lewat
 * `app/(leader)/layout.tsx` (dihapus) -- setiap halaman render ini
 * sendiri, supaya posisinya bisa persis satu baris dengan navigasi yang
 * sudah ada di halaman itu (permintaan Yolanda), bukan strip terpisah di
 * atas semua halaman.
 */
export function LeaderNotificationBell() {
  return (
    <Suspense fallback={<NotificationBellSkeleton />}>
      <LeaderNotificationBellData />
    </Suspense>
  );
}
