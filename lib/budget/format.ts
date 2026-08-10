import type { BudgetSubmissionStatus } from "@/lib/budget/submission";

/**
 * Diekstrak dari BudgetSubmissionSection (Fase 5) supaya Dashboard Kepanitiaan
 * (Fase 6) bisa menampilkan badge status budgeting yang sama persis tanpa
 * duplikasi warna/label di 2 tempat.
 */
export const BUDGET_STATUS_LABEL: Record<BudgetSubmissionStatus, string> = {
  belum: "Belum Lengkap",
  lengkap: "Lengkap",
};

export const BUDGET_STATUS_BADGE_CLASSNAME: Record<BudgetSubmissionStatus, string> = {
  belum: "border-pink-300 bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",
  lengkap: "border-green-300 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};
