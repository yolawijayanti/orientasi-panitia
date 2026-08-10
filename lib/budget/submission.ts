import type { createClient } from "@/lib/supabase/server";
import { SUBMISSION_BUCKET } from "@/lib/budget/constants";

export type BudgetSubmissionStatus = "belum" | "lengkap";

export type BudgetSubmission = {
  status: BudgetSubmissionStatus;
  submittedAt: string | null;
  /** Signed URL sekali pakai (kedaluwarsa cepat) -- null kalau belum ada file. */
  fileUrl: string | null;
};

const SIGNED_URL_TTL_SECONDS = 60;

/**
 * Bucket `budget-submission` PRIVATE (beda dari budget-template/kepanitiaan-
 * logo yang public), karena isinya dokumen budget sungguhan milik satu
 * instance. Jadi file_url yang tersimpan di tabel budget_submissions itu
 * STORAGE PATH, bukan URL publik -- signed URL selalu di-generate ulang
 * saat render (di sini), tidak pernah disimpan karena kedaluwarsa.
 */
export async function loadBudgetSubmission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kepanitiaanSiteId: string,
): Promise<BudgetSubmission> {
  const { data: row } = await supabase
    .from("budget_submissions")
    .select("status, file_url, submitted_at")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
    .maybeSingle();

  const status = (row?.status as BudgetSubmissionStatus | undefined) ?? "belum";
  const submittedAt = row?.submitted_at ?? null;

  if (!row?.file_url) {
    return { status, submittedAt, fileUrl: null };
  }

  const { data: signed } = await supabase.storage
    .from(SUBMISSION_BUCKET)
    .createSignedUrl(row.file_url, SIGNED_URL_TTL_SECONDS);

  return { status, submittedAt, fileUrl: signed?.signedUrl ?? null };
}
