import { PanitiaNotificationBell } from "@/components/notifications/panitia-notification-bell";

/** Sama seperti app/(leader)/layout.tsx -- lihat komentar di sana untuk alasan lengkap (bugfix performa Revisi 5 + strip posisi konsisten Revisi 6). */
export default function PanitiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex justify-end border-b p-3">
        <PanitiaNotificationBell />
      </div>
      {children}
    </div>
  );
}
