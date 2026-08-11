"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_BUDGET_MIME,
  MAX_BUDGET_FILE_BYTES,
  SUBMISSION_BUCKET,
} from "@/lib/budget/constants";
import { checkAndNotifyBudgetLengkap } from "@/lib/notifications/notify";

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

/**
 * Upload/ganti file submission budget satu instance. Tidak ada pengecekan
 * role manual -- RLS Storage (`budget_submission_scoped_*`, migration
 * 20260810000009) dan policy `budget_submissions_scoped` (Fase 1) yang jadi
 * penjaga: panitia hanya bisa menulis ke instance-nya sendiri, leader bisa
 * ke instance manapun, konsisten dengan pola addTask/addBucket.
 */
export async function submitBudget(
  kepanitiaanSiteId: string,
  redirectTo: string,
  formData: FormData,
) {
  const file = formData.get("submission");

  if (!(file instanceof File) || file.size === 0) {
    withError(redirectTo, "Pilih file budget dulu sebelum menekan Upload.");
  }

  const ext = ALLOWED_BUDGET_MIME.get(file.type);
  if (!ext) {
    withError(redirectTo, "Format harus PDF, Excel (XLS/XLSX), atau Word (DOC/DOCX).");
  }

  if (file.size > MAX_BUDGET_FILE_BYTES) {
    withError(redirectTo, "Ukuran file maksimal 10 MB.");
  }

  const supabase = await createClient();
  const folder = kepanitiaanSiteId;

  // Satu instance = satu file submission aktif. Objek lama dihapus dulu
  // (ekstensinya bisa berubah antar-upload), sama seperti pola template.
  const { data: existing } = await supabase.storage.from(SUBMISSION_BUCKET).list(folder);
  if (existing?.length) {
    await supabase.storage
      .from(SUBMISSION_BUCKET)
      .remove(existing.map((existingFile) => `${folder}/${existingFile.name}`));
  }

  const path = `${folder}/submission.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(SUBMISSION_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    withError(redirectTo, `Gagal mengunggah file: ${uploadError.message}`);
  }

  // file_url menyimpan STORAGE PATH (bukan URL publik) -- lihat komentar di
  // lib/budget/submission.ts kenapa.
  const { error: dbError } = await supabase.from("budget_submissions").upsert(
    {
      kepanitiaan_site_id: kepanitiaanSiteId,
      file_url: path,
      status: "lengkap",
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "kepanitiaan_site_id" },
  );

  if (dbError) {
    withError(redirectTo, "File terunggah tapi gagal disimpan statusnya.");
  }

  await checkAndNotifyBudgetLengkap(supabase, kepanitiaanSiteId);

  revalidatePath(redirectTo);
}
