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

/**
 * Serialisasi Date -> "yyyy-mm-dd" pakai getter tanggal lokal (getFullYear/
 * getMonth/getDate), BUKAN toISOString() (yang konversi ke UTC dulu).
 * toISOString() menggeser tanggal mundur 1 hari untuk timezone di depan UTC
 * (WIB/WITA/WIT semua begitu) -- dan karena getWeekStart/addDays saling
 * panggil berantai di buildGanttWeeks, error itu numpuk tiap iterasi (minggu
 * ke-2 meleset 1 hari, minggu ke-3 meleset 2 hari, dst).
 */
function toLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekStart(tanggal: string): string {
  const date = new Date(`${tanggal}T00:00:00`);
  const dayOfWeek = date.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  date.setDate(date.getDate() - diffToMonday);
  return toLocalIso(date);
}

function addDays(tanggal: string, days: number): string {
  const date = new Date(`${tanggal}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalIso(date);
}

export type GanttWeek = { weekStart: string; weekEnd: string };

/**
 * Kolom minggu untuk Gantt chart: dari minggu (Senin) milestone yang paling
 * awal mulai, sampai minggu milestone yang paling akhir selesai. Kalau ada
 * milestone yang rentangnya bertumpuk, kolomnya tetap satu deret lurus
 * (bukan per-milestone) supaya semua baris berbagi sumbu waktu yang sama.
 */
export function buildGanttWeeks(
  milestones: { tanggal_mulai: string; tanggal_selesai: string | null }[],
): GanttWeek[] {
  if (milestones.length === 0) return [];

  const startWeeks = milestones.map((m) => getWeekStart(m.tanggal_mulai));
  const endWeeks = milestones.map((m) => getWeekStart(m.tanggal_selesai ?? m.tanggal_mulai));
  const earliest = startWeeks.reduce((a, b) => (a < b ? a : b));
  const latest = endWeeks.reduce((a, b) => (a > b ? a : b));

  const weeks: GanttWeek[] = [];
  for (let cursor = earliest; cursor <= latest; cursor = addDays(cursor, 7)) {
    weeks.push({ weekStart: cursor, weekEnd: addDays(cursor, 6) });
  }
  return weeks;
}
