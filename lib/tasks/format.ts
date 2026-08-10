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

/**
 * Warna kapsul status, dipakai SERAGAM di semua tempat status muncul:
 * kartu board, ringkasan tugas/subtugas, radio single-choice, dan Tugas Saya.
 * Assigned = pink, In Progress = kuning, Done = hijau.
 */
export const STATUS_CHIP_CLASSNAME: Record<ItemStatus, string> = {
  belum: "border-pink-300 bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",
  proses: "border-yellow-300 bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  selesai:
    "border-green-300 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "Tanpa deadline";
  return new Date(`${deadline}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
