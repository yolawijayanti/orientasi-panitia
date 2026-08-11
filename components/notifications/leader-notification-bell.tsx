import { Suspense } from "react";

import { NotificationBell, NotificationBellSkeleton } from "@/components/notifications/notification-bell";
import { loadLeaderNotifications } from "@/lib/notifications/feed";
import { countUnread, loadNotificationsSeenAt } from "@/lib/notifications/unread";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

/**
 * Async Server Component -- data-fetching-nya SENGAJA dipisah dari
 * `LeaderNotificationBell` (default export di bawah) supaya bisa
 * dibungkus <Suspense>. Kalau di-await LANGSUNG di komponen yang dirender
 * sejajar dengan konten halaman (versi Revisi 2/3 sebelumnya, taruh
 * langsung di badan `app/(leader)/layout.tsx`), seluruh render halaman
 * ikut ketahan menunggu query ini selesai -- ini pola yang secara
 * eksplisit diperingatkan di dokumentasi Next.js (`node_modules/next/dist/
 * docs/01-app/02-guides/authentication.md`, bagian "Auth checks in shared
 * layouts"): "A top-level await on ... the DAL in a layout delays the
 * first streamed chunk for that segment." Efek nyatanya: navigasi antar
 * halaman leader jadi lambat begitu fitur notifikasi ditambah (dilaporkan
 * Yolanda sebagai tombol yang "tidak merespon" -- root cause-nya lambat,
 * bukan benar-benar macet).
 *
 * `getCurrentUser()` (bukan `supabase.auth.getUser()` manual) -- helper
 * ber-`React.cache()` supaya lookup auth+profile ini SHARED dengan
 * pemanggil lain di request yang sama, bukan round-trip baru lagi
 * (Revisi 6, lihat lib/auth/current-user.ts).
 */
async function LeaderNotificationBellData() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const [notifications, seenAt] = await Promise.all([
    loadLeaderNotifications(supabase),
    currentUser ? loadNotificationsSeenAt(supabase, currentUser.id) : Promise.resolve(null),
  ]);

  return (
    <NotificationBell notifications={notifications} unreadCount={countUnread(notifications, seenAt)} />
  );
}

/**
 * Dipasang di `app/(leader)/layout.tsx`, di strip khusus di atas
 * `{children}` -- markup-nya sama persis di semua halaman leader, jadi
 * posisinya selalu konsisten (Revisi 6, lihat HANDOVER.md -- 2 percobaan
 * sebelumnya, per-halaman lewat prop `right` di PageNav dan `position:
 * fixed`, sama-sama bikin posisi tidak konsisten/berisiko tumpang tindih
 * dengan konten halaman).
 */
export function LeaderNotificationBell() {
  return (
    <Suspense fallback={<NotificationBellSkeleton />}>
      <LeaderNotificationBellData />
    </Suspense>
  );
}
