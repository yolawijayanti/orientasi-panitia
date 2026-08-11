"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotificationFeed } from "@/components/notifications/notification-feed";
import { markNotificationsSeen } from "@/lib/notifications/mark-seen";
import type { NotificationItem } from "@/lib/notifications/feed";

/**
 * Tombol lonceng yang muncul di semua halaman leader DAN panitia (dipasang
 * di app/(leader)/layout.tsx dan app/(panitia)/layout.tsx). "use client"
 * cuma untuk toggle buka/tutup dropdown + badge counter -- datanya sendiri
 * tetap difetch di server (layout) lalu dioper sebagai prop, pola sama
 * seperti SideTabs (Fase 4). Isi dropdown reuse `NotificationFeed` apa
 * adanya, tidak ada logic list yang diduplikasi.
 *
 * `unreadCount` dihitung di server (layout) dari `notifications_seen_at`
 * akun ini vs `sentAt` tiap notifikasi -- begitu dropdown dibuka, badge
 * langsung disembunyikan secara OPTIMISTIC (state lokal `localUnread`)
 * sambil `markNotificationsSeen()` jalan di background supaya status
 * "sudah dilihat" itu PERSISTEN (tidak balik muncul di navigasi
 * berikutnya).
 */
export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localUnread, setLocalUnread] = useState(unreadCount);

  function handleToggle() {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && localUnread > 0) {
      setLocalUnread(0);
      void markNotificationsSeen();
    }
  }

  return (
    <div className="relative">
      <Button type="button" variant="outline" size="icon" aria-label="Notifikasi" onClick={handleToggle}>
        <Bell className="size-4" />
      </Button>

      {localUnread > 0 && (
        <span className="pointer-events-none absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
          {localUnread > 9 ? "9+" : localUnread}
        </span>
      )}

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80">
          <NotificationFeed notifications={notifications} />
        </div>
      )}
    </div>
  );
}

/** Fallback <Suspense> saat NotificationBell*Server masih memuat data -- bell statis, belum interaktif, tidak menahan render sisa halaman. */
export function NotificationBellSkeleton() {
  return (
    <Button type="button" variant="outline" size="icon" aria-label="Notifikasi" disabled>
      <Bell className="size-4" />
    </Button>
  );
}
