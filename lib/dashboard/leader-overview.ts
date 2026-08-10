import type { createClient } from "@/lib/supabase/server";
import { loadBucketBoardData } from "@/lib/buckets/board-data";
import { loadBudgetSubmission, type BudgetSubmissionStatus } from "@/lib/budget/submission";
import type { Progress } from "@/lib/tasks/progress";

export type InstanceOption = { id: string; kepanitiaanNama: string; siteNama: string };

export type InstanceGroup = { kepanitiaanId: string; kepanitiaanNama: string; instances: InstanceOption[] };

type InstanceRow = {
  id: string;
  kepanitiaan: { id: string; nama: string } | null;
  site: { nama_site: string } | null;
};

/**
 * Semua instance `kepanitiaan_site`, dikelompokkan per kepanitiaan (nama
 * event) -- dipakai untuk checklist multi-select di Dashboard Kepanitiaan.
 * Diurutkan by nama supaya checklist-nya enak ditelusuri leader begitu jumlah
 * event/site sudah banyak (tidak ikut urutan insert seperti
 * `/leader/kepanitiaan`).
 */
export async function loadInstanceGroups(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<InstanceGroup[]> {
  const { data } = await supabase
    .from("kepanitiaan_site")
    .select("id, kepanitiaan(id, nama), site:sites(nama_site)");

  const rows = (data ?? []) as unknown as InstanceRow[];

  const grouped = new Map<string, InstanceGroup>();
  for (const row of rows) {
    if (!row.kepanitiaan) continue;
    const key = row.kepanitiaan.id;
    if (!grouped.has(key)) {
      grouped.set(key, { kepanitiaanId: key, kepanitiaanNama: row.kepanitiaan.nama, instances: [] });
    }
    grouped.get(key)!.instances.push({
      id: row.id,
      kepanitiaanNama: row.kepanitiaan.nama,
      siteNama: row.site?.nama_site ?? "Site tidak diketahui",
    });
  }

  const groups = Array.from(grouped.values());
  groups.sort((a, b) => a.kepanitiaanNama.localeCompare(b.kepanitiaanNama));
  for (const group of groups) {
    group.instances.sort((a, b) => a.siteNama.localeCompare(b.siteNama));
  }
  return groups;
}

export type InstanceOverview = InstanceOption & {
  masterProgress: Progress;
  bucketProgress: { id: string; namaBidang: string; isBudgeting: boolean; progress: Progress }[];
  budgetStatus: BudgetSubmissionStatus;
};

/**
 * Ringkasan progres 1 instance untuk perbandingan side-by-side: progres
 * gabungan tugas+subtugas (reuse `loadBucketBoardData`, sama seperti
 * dashboard panitia & halaman bucket supaya angkanya konsisten), progres per
 * bidang, dan status budgeting (reuse `loadBudgetSubmission` dari Fase 5).
 */
export async function loadInstanceOverview(
  supabase: Awaited<ReturnType<typeof createClient>>,
  instance: InstanceOption,
): Promise<InstanceOverview> {
  const { data: buckets } = await supabase
    .from("buckets")
    .select("id, nama_bidang, is_budgeting")
    .eq("kepanitiaan_site_id", instance.id)
    .order("created_at");

  const bucketRows = (buckets ?? []) as { id: string; nama_bidang: string; is_budgeting: boolean }[];

  const [board, budget] = await Promise.all([
    loadBucketBoardData(supabase, instance.id, bucketRows),
    loadBudgetSubmission(supabase, instance.id),
  ]);

  return {
    ...instance,
    masterProgress: board.masterProgress,
    bucketProgress: bucketRows.map((bucket) => ({
      id: bucket.id,
      namaBidang: bucket.nama_bidang,
      isBudgeting: bucket.is_budgeting,
      progress: board.progressByBucket[bucket.id] ?? { total: 0, done: 0, percent: 0 },
    })),
    budgetStatus: budget.status,
  };
}
