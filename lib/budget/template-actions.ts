"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ALLOWED_BUDGET_MIME, MAX_BUDGET_FILE_BYTES, TEMPLATE_BUCKET } from "@/lib/budget/constants";

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

/** Kosongkan folder event ini dulu sebelum upload baru -- lihat komentar di uploadBudgetTemplate. */
async function clearTemplateFolder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kepanitiaanId: string,
) {
  const { data: existing } = await supabase.storage.from(TEMPLATE_BUCKET).list(kepanitiaanId);
  if (existing?.length) {
    await supabase.storage
      .from(TEMPLATE_BUCKET)
      .remove(existing.map((file) => `${kepanitiaanId}/${file.name}`));
  }
}

/**
 * Leader-only lewat RLS (`budget_template_insert_leader`/`_update_leader`,
 * migration 20260810000009) -- tidak ada pengecekan role manual di sini,
 * konsisten dengan pola uploadKepanitiaanLogo Fase 4. Policy-nya tidak
 * peduli path/folder di dalam bucket, cuma peduli `is_leader()`, jadi tidak
 * perlu migration baru untuk mendukung 1 folder per event.
 *
 * Tiap folder event sengaja dijaga cuma berisi 1 objek aktif: objek lama
 * dihapus dulu sebelum upload baru, karena ekstensi filenya bisa berubah
 * antar-upload (misal xlsx -> pdf) sehingga tidak cukup upsert ke nama
 * tetap seperti pola logo (yang cuma 2 kemungkinan ekstensi, png/jpg).
 */
export async function uploadBudgetTemplate(
  kepanitiaanId: string,
  redirectTo: string,
  formData: FormData,
) {
  const file = formData.get("template");

  if (!(file instanceof File) || file.size === 0) {
    withError(redirectTo, "Pilih file template dulu sebelum menekan Upload.");
  }

  const ext = ALLOWED_BUDGET_MIME.get(file.type);
  if (!ext) {
    withError(redirectTo, "Format harus PDF, Excel (XLS/XLSX), atau Word (DOC/DOCX).");
  }

  if (file.size > MAX_BUDGET_FILE_BYTES) {
    withError(redirectTo, "Ukuran file maksimal 10 MB.");
  }

  const supabase = await createClient();

  await clearTemplateFolder(supabase, kepanitiaanId);

  const { error: uploadError } = await supabase.storage
    .from(TEMPLATE_BUCKET)
    .upload(`${kepanitiaanId}/template.${ext}`, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    withError(redirectTo, `Gagal mengunggah template: ${uploadError.message}`);
  }

  revalidatePath(redirectTo);
}

export async function removeBudgetTemplate(kepanitiaanId: string, redirectTo: string) {
  const supabase = await createClient();
  await clearTemplateFolder(supabase, kepanitiaanId);
  revalidatePath(redirectTo);
}
