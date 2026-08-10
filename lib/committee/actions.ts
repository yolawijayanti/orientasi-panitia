"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type CommitteeRole = "anggota" | "leader_bidang";

function parseRole(value: FormDataEntryValue | null): CommitteeRole {
  return value === "leader_bidang" ? "leader_bidang" : "anggota";
}

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

/**
 * bucket_id berlaku untuk SEMUA anggota, bukan cuma leader_bidang.
 *
 * Ini membalik keputusan Fase 3 (yang me-null-kan bucket_id kalau role bukan
 * leader_bidang): sejak susunan panitia dikelompokkan per bidang, anggota
 * biasa juga harus punya bidang -- kalau tidak, semua anggota jatuh ke grup
 * "Tanpa Bidang" dan pengelompokannya jadi tidak ada gunanya. Role sekarang
 * cuma menentukan urutan di dalam grup (leader_bidang selalu paling atas),
 * bukan boleh-tidaknya punya bidang.
 */
function parseBucketId(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function addCommitteeMember(
  kepanitiaanSiteId: string,
  redirectTo: string,
  formData: FormData,
) {
  const nama = formData.get("nama");
  if (typeof nama !== "string" || !nama.trim()) {
    withError(redirectTo, "Nama anggota wajib diisi.");
  }

  const email = formData.get("email");
  const role = parseRole(formData.get("role"));
  const supabase = await createClient();
  const { error } = await supabase.from("committee_members").insert({
    kepanitiaan_site_id: kepanitiaanSiteId,
    nama: (nama as string).trim(),
    email: typeof email === "string" && email.trim() ? email.trim() : null,
    role,
    bucket_id: parseBucketId(formData.get("bucket_id")),
  });

  if (error) {
    withError(redirectTo, "Gagal menambah anggota panitia.");
  }

  revalidatePath(redirectTo);
}

export async function updateCommitteeMember(
  memberId: string,
  redirectTo: string,
  formData: FormData,
) {
  const nama = formData.get("nama");
  if (typeof nama !== "string" || !nama.trim()) {
    withError(redirectTo, "Nama anggota wajib diisi.");
  }

  const email = formData.get("email");
  const role = parseRole(formData.get("role"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("committee_members")
    .update({
      nama: (nama as string).trim(),
      email: typeof email === "string" && email.trim() ? email.trim() : null,
      role,
      bucket_id: parseBucketId(formData.get("bucket_id")),
    })
    .eq("id", memberId);

  if (error) {
    withError(redirectTo, "Gagal menyimpan perubahan anggota.");
  }

  revalidatePath(redirectTo);
}

export async function deleteCommitteeMember(memberId: string, redirectTo: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("committee_members").delete().eq("id", memberId);

  if (error) {
    withError(redirectTo, "Gagal menghapus anggota panitia.");
  }

  revalidatePath(redirectTo);
}
