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

export async function renameBucket(bucketId: string, redirectTo: string, formData: FormData) {
  const namaBidang = formData.get("nama_bidang");
  if (typeof namaBidang !== "string" || !namaBidang.trim()) {
    withError(redirectTo, "Nama bidang wajib diisi.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("buckets")
    .update({ nama_bidang: (namaBidang as string).trim() })
    .eq("id", bucketId);

  if (error) {
    withError(redirectTo, "Gagal mengubah nama bidang.");
  }

  revalidatePath(redirectTo);
}

export async function deleteBucket(bucketId: string, redirectTo: string) {
  const supabase = await createClient();

  const { data: bucket } = await supabase
    .from("buckets")
    .select("nama_bidang, is_budgeting")
    .eq("id", bucketId)
    .single();

  if (!bucket) {
    withError(redirectTo, "Bidang tidak ditemukan.");
  }

  // Bucket Budgeting dilindungi: widget download-template + upload-submission
  // di Fase 5 bergantung pada adanya bucket ber-flag is_budgeting di tiap
  // instance. Kalau terhapus, instance itu kehilangan tempat submit budget
  // dan tidak ada cara membuatnya lagi dari UI (form "+ Tambah Bidang"
  // selalu membuat bucket biasa).
  if (bucket.is_budgeting) {
    withError(
      redirectTo,
      "Bidang Budgeting tidak bisa dihapus karena dipakai untuk submit budget kepanitiaan.",
    );
  }

  const { error } = await supabase.from("buckets").delete().eq("id", bucketId);
  if (error) {
    withError(redirectTo, "Gagal menghapus bidang.");
  }

  revalidatePath(redirectTo);
}
