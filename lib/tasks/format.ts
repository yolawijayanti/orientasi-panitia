import type { ItemStatus } from "@/lib/tasks/actions";

/**
 * Nilai di DB tetap `belum`/`proses`/`selesai` (check constraint dari Fase 1
 * tidak diubah), yang berganti cuma labelnya -- Yolanda minta istilah
 * Assigned/In Progress/Done. Jadi tidak ada migration untuk ini.
 */
export const STATUS_LABEL: Record<ItemStatus, string> = {
  belum: "Assigned",
  proses: "In Progress",
  selesai: "Done",
};

/** Urutan tampil untuk pilihan status (kiri -> kanan mengikuti alur kerja). */
export const STATUS_ORDER: ItemStatus[] = ["belum", "proses", "selesai"];

export const STATUS_BADGE_VARIANT: Record<ItemStatus, "outline" | "secondary" | "default"> = {
  belum: "outline",
  proses: "secondary",
  selesai: "default",
};

/** Warna chip status -- dipakai di board Trello & radio single-choice. */
export const STATUS_CHIP_CLASSNAME: Record<ItemStatus, string> = {
  belum: "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  proses: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  selesai:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "Tanpa deadline";
  return new Date(`${deadline}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
