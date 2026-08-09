export type MilestoneStatus = "akan_datang" | "berlangsung" | "lewat";

export const STATUS_LABEL: Record<MilestoneStatus, string> = {
  akan_datang: "Akan Datang",
  berlangsung: "Berlangsung",
  lewat: "Sudah Lewat",
};

export const STATUS_BADGE_VARIANT: Record<MilestoneStatus, "outline" | "default" | "muted"> = {
  akan_datang: "outline",
  berlangsung: "default",
  lewat: "muted",
};

/** Timeline ini dipakai khusus untuk event di Indonesia, jadi "hari ini" dikunci ke WIB/WITA/WIT terdekat (Asia/Jakarta) daripada timezone server (biasanya UTC di Vercel) supaya status tidak meleset di dini hari. */
export function todayJakartaISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function getMilestoneStatus(
  tanggalMulai: string,
  tanggalSelesai: string | null,
  todayIso: string,
): MilestoneStatus {
  const akhir = tanggalSelesai ?? tanggalMulai;
  if (todayIso > akhir) return "lewat";
  if (todayIso >= tanggalMulai) return "berlangsung";
  return "akan_datang";
}

export function formatTanggal(tanggal: string): string {
  return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRentangTanggal(mulai: string, selesai: string | null): string {
  if (!selesai || selesai === mulai) return formatTanggal(mulai);
  return `${formatTanggal(mulai)} – ${formatTanggal(selesai)}`;
}

function getWeekStart(tanggal: string): string {
  const date = new Date(`${tanggal}T00:00:00`);
  const dayOfWeek = date.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  date.setDate(date.getDate() - diffToMonday);
  return date.toISOString().slice(0, 10);
}

function getWeekEnd(weekStartIso: string): string {
  const date = new Date(`${weekStartIso}T00:00:00`);
  date.setDate(date.getDate() + 6);
  return date.toISOString().slice(0, 10);
}

export function groupByWeek<T>(
  items: T[],
  getTanggalMulai: (item: T) => string,
): { weekStart: string; weekEnd: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const weekStart = getWeekStart(getTanggalMulai(item));
    if (!map.has(weekStart)) map.set(weekStart, []);
    map.get(weekStart)!.push(item);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, weekItems]) => ({
      weekStart,
      weekEnd: getWeekEnd(weekStart),
      items: weekItems,
    }));
}
