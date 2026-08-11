import type { NotificationJenis } from "@/lib/notifications/feed";
import { STATUS_CHIP_CLASSNAME } from "@/lib/tasks/format";

export const NOTIF_JENIS_LABEL: Record<NotificationJenis, string> = {
  reminder_deadline: "Deadline Mendekat",
  task_assigned: "Tugas Baru",
  budget_lengkap: "Budget Lengkap",
  instance_selesai: "Semua Tugas Selesai",
};

/**
 * Reuse warna kapsul status tugas yang sudah ada (Fase 4 ronde 3, Assigned
 * = pink / In Progress = kuning / Done = hijau) -- bukan warna baru:
 * task_assigned ~ "baru ditugaskan" (pink, sama semantik dengan Assigned),
 * reminder_deadline ~ "masih berjalan, butuh perhatian" (kuning, sama
 * semantik dengan In Progress), budget_lengkap/instance_selesai ~
 * "pencapaian" (hijau, sama semantik dengan Done).
 */
export const NOTIF_JENIS_BADGE_CLASSNAME: Record<NotificationJenis, string> = {
  task_assigned: STATUS_CHIP_CLASSNAME.belum,
  reminder_deadline: STATUS_CHIP_CLASSNAME.proses,
  budget_lengkap: STATUS_CHIP_CLASSNAME.selesai,
  instance_selesai: STATUS_CHIP_CLASSNAME.selesai,
};

export function formatWaktuNotifikasi(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoTimestamp));
}
