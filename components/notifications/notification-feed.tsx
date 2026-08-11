import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NotificationItem } from "@/lib/notifications/feed";
import { NOTIF_JENIS_BADGE_CLASSNAME, NOTIF_JENIS_LABEL, formatWaktuNotifikasi } from "@/lib/notifications/format";

/**
 * Read-only, nol client-side JS -- mengikuti pola InstanceOverviewCard
 * (Fase 6). Dipakai untuk feed leader MAUPUN panitia (isi dropdown lonceng
 * NotificationBell) -- makanya teks kosongnya generik, tidak menyebut jenis
 * notifikasi tertentu.
 */
export function NotificationFeed({ notifications }: { notifications: NotificationItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifikasi Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada notifikasi.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm last:border-b-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      NOTIF_JENIS_BADGE_CLASSNAME[notif.jenis],
                    )}
                  >
                    {NOTIF_JENIS_LABEL[notif.jenis]}
                  </span>
                  <span>{notif.instanceLabel}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatWaktuNotifikasi(notif.sentAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
