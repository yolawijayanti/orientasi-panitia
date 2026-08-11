"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotificationFeed } from "@/components/notifications/notification-feed";
import type { LeaderNotification } from "@/lib/notifications/leader-feed";

/**
 * Tombol lonceng yang muncul di semua halaman leader (dipasang di
 * app/(leader)/layout.tsx, bukan cuma di 1 halaman). "use client" cuma
 * untuk toggle buka/tutup dropdown -- datanya sendiri tetap difetch di
 * server (layout) lalu dioper sebagai prop, pola sama seperti SideTabs
 * (Fase 4). Isi dropdown reuse `NotificationFeed` yang sama seperti versi
 * card sebelumnya (lihat HANDOVER.md Catatan Teknis Fase 7 Revisi 2) --
 * tidak ada logic list yang diduplikasi.
 */
export function NotificationBell({ notifications }: { notifications: LeaderNotification[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Notifikasi"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell className="size-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80">
          <NotificationFeed notifications={notifications} />
        </div>
      )}
    </div>
  );
}
