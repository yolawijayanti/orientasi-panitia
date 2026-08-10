import type { ItemStatus } from "@/lib/tasks/actions";

export const STATUS_LABEL: Record<ItemStatus, string> = {
  belum: "Belum",
  proses: "Proses",
  selesai: "Selesai",
};

export const STATUS_BADGE_VARIANT: Record<ItemStatus, "outline" | "secondary" | "default"> = {
  belum: "outline",
  proses: "secondary",
  selesai: "default",
};

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "Tanpa deadline";
  return new Date(`${deadline}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
