"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

function parseTanggalSelesai(
  value: FormDataEntryValue | null,
  tanggalMulai: string,
  redirectTo: string,
): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  const tanggalSelesai = value.trim();
  if (tanggalSelesai < tanggalMulai) {
    withError(redirectTo, "Tanggal selesai tidak boleh sebelum tanggal mulai.");
  }

  return tanggalSelesai;
}

export async function addMilestone(
  kepanitiaanSiteId: string,
  redirectTo: string,
  formData: FormData,
) {
  const namaMilestone = formData.get("nama_milestone");
  if (typeof namaMilestone !== "string" || !namaMilestone.trim()) {
    withError(redirectTo, "Nama milestone wajib diisi.");
  }

  const tanggalMulai = formData.get("tanggal_mulai");
  if (typeof tanggalMulai !== "string" || !tanggalMulai.trim()) {
    withError(redirectTo, "Tanggal mulai wajib diisi.");
  }

  const tanggalSelesai = parseTanggalSelesai(
    formData.get("tanggal_selesai"),
    tanggalMulai as string,
    redirectTo,
  );

  const supabase = await createClient();
  const { error } = await supabase.from("timeline_milestones").insert({
    kepanitiaan_site_id: kepanitiaanSiteId,
    nama_milestone: (namaMilestone as string).trim(),
    tanggal_mulai: tanggalMulai,
    tanggal_selesai: tanggalSelesai,
  });

  if (error) {
    withError(redirectTo, "Gagal menambah milestone.");
  }

  revalidatePath(redirectTo);
}

export async function updateMilestone(
  milestoneId: string,
  redirectTo: string,
  formData: FormData,
) {
  const namaMilestone = formData.get("nama_milestone");
  if (typeof namaMilestone !== "string" || !namaMilestone.trim()) {
    withError(redirectTo, "Nama milestone wajib diisi.");
  }

  const tanggalMulai = formData.get("tanggal_mulai");
  if (typeof tanggalMulai !== "string" || !tanggalMulai.trim()) {
    withError(redirectTo, "Tanggal mulai wajib diisi.");
  }

  const tanggalSelesai = parseTanggalSelesai(
    formData.get("tanggal_selesai"),
    tanggalMulai as string,
    redirectTo,
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("timeline_milestones")
    .update({
      nama_milestone: (namaMilestone as string).trim(),
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
    })
    .eq("id", milestoneId);

  if (error) {
    withError(redirectTo, "Gagal menyimpan perubahan milestone.");
  }

  revalidatePath(redirectTo);
}

export async function deleteMilestone(milestoneId: string, redirectTo: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("timeline_milestones").delete().eq("id", milestoneId);

  if (error) {
    withError(redirectTo, "Gagal menghapus milestone.");
  }

  revalidatePath(redirectTo);
}
