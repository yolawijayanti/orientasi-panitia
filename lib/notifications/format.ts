import type { LeaderNotificationJenis } from "@/lib/notifications/leader-feed";

export const NOTIF_JENIS_LABEL: Record<LeaderNotificationJenis, string> = {
  budget_lengkap: "Budget Lengkap",
  instance_selesai: "Semua Tugas Selesai",
};

/** Reuse warna hijau "selesai"/"lengkap" yang sudah ada (Fase 4/5) -- kedua jenis di feed ini sama-sama kabar baik (pencapaian), jadi tidak perlu warna baru. */
export const NOTIF_JENIS_BADGE_CLASSNAME: Record<LeaderNotificationJenis, string> = {
  budget_lengkap: "border-green-300 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  instance_selesai: "border-green-300 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};

export function formatWaktuNotifikasi(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoTimestamp));
}
