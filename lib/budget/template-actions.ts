"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ALLOWED_BUDGET_MIME, MAX_BUDGET_FILE_BYTES, TEMPLATE_BUCKET } from "@/lib/budget/constants";

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

/** Kosongkan bucket dulu sebelum upload baru -- lihat komentar di uploadBudgetTemplate. */
async function clearTemplateBucket(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: existing } = await supabase.storage.from(TEMPLATE_BUCKET).list();
  if (existing?.length) {
    await supabase.storage.from(TEMPLATE_BUCKET).remove(existing.map((file) => file.name));
  }
}

/**
 * Leader-only lewat RLS (`budget_template_insert_leader`/`_update_leader`,
 * migration 20260810000009) -- tidak ada pengecekan role manual di sini,
 * konsisten dengan pola uploadKepanitiaanLogo Fase 4.
 *
 * Bucket ini sengaja dijaga cuma berisi 1 objek aktif: objek lama dihapus
 * dulu sebelum upload baru, karena ekstensi filenya bisa berubah antar-
 * upload (misal xlsx -> pdf) sehingga tidak cukup upsert ke nama tetap
 * seperti pola logo (yang cuma 2 kemungkinan ekstensi, png/jpg).
 */
export async function uploadBudgetTemplate(redirectTo: string, formData: FormData) {
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

  await clearTemplateBucket(supabase);

  const { error: uploadError } = await supabase.storage
    .from(TEMPLATE_BUCKET)
    .upload(`template.${ext}`, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    withError(redirectTo, `Gagal mengunggah template: ${uploadError.message}`);
  }

  revalidatePath(redirectTo);
}

export async function removeBudgetTemplate(redirectTo: string) {
  const supabase = await createClient();
  await clearTemplateBucket(supabase);
  revalidatePath(redirectTo);
}
