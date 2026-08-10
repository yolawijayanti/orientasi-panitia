"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

export async function addBucket(kepanitiaanSiteId: string, redirectTo: string, formData: FormData) {
  const namaBidang = formData.get("nama_bidang");
  if (typeof namaBidang !== "string" || !namaBidang.trim()) {
    withError(redirectTo, "Nama bidang wajib diisi.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("buckets").insert({
    kepanitiaan_site_id: kepanitiaanSiteId,
    nama_bidang: (namaBidang as string).trim(),
    is_default: false,
    is_budgeting: false,
  });

  if (error) {
    withError(redirectTo, "Gagal menambah bidang.");
  }

  revalidatePath(redirectTo);
}
