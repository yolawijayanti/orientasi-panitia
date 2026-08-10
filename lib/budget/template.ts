import type { createClient } from "@/lib/supabase/server";
import { TEMPLATE_BUCKET } from "@/lib/budget/constants";

export type BudgetTemplate = { name: string; url: string };

/**
 * Template budgeting itu SATU file per EVENT (`kepanitiaan`, misal "PON"),
 * bukan per instance kepanitiaan_site (site-nya) dan bukan lagi 1 file
 * global untuk semua event -- event yang berbeda bisa punya kebutuhan
 * budgeting berbeda. Disimpan sebagai folder per `kepanitiaan.id` di dalam
 * bucket `budget-template` yang sama (bukan bucket baru), jadi tidak ada
 * baris tabel yang menyimpan metadata-nya -- cukup list() folder itu.
 * Tiap folder sengaja dijaga cuma berisi maksimal 1 objek (lihat
 * uploadBudgetTemplate), jadi ambil yang pertama saja.
 */
export async function loadBudgetTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kepanitiaanId: string,
): Promise<BudgetTemplate | null> {
  const { data } = await supabase.storage.from(TEMPLATE_BUCKET).list(kepanitiaanId);
  const file = data?.[0];
  if (!file) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from(TEMPLATE_BUCKET).getPublicUrl(`${kepanitiaanId}/${file.name}`);

  return { name: file.name, url: publicUrl };
}
