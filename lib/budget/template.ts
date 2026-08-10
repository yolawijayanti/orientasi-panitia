import type { createClient } from "@/lib/supabase/server";
import { TEMPLATE_BUCKET } from "@/lib/budget/constants";

export type BudgetTemplate = { name: string; url: string };

/**
 * Template budgeting itu SATU file global untuk semua instance (bukan per
 * kepanitiaan_site_id), jadi tidak ada baris tabel yang menyimpan
 * metadata-nya -- cukup list() bucket-nya. Bucket ini sengaja dijaga cuma
 * berisi maksimal 1 objek (lihat uploadBudgetTemplate), jadi ambil yang
 * pertama saja.
 */
export async function loadBudgetTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<BudgetTemplate | null> {
  const { data } = await supabase.storage.from(TEMPLATE_BUCKET).list();
  const file = data?.[0];
  if (!file) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from(TEMPLATE_BUCKET).getPublicUrl(file.name);

  return { name: file.name, url: publicUrl };
}
