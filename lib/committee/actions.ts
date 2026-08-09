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
  const supabase = await createClient();
  const { error } = await supabase.from("committee_members").insert({
    kepanitiaan_site_id: kepanitiaanSiteId,
    nama: (nama as string).trim(),
    email: typeof email === "string" && email.trim() ? email.trim() : null,
    role: parseRole(formData.get("role")),
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
  const supabase = await createClient();
  const { error } = await supabase
    .from("committee_members")
    .update({
      nama: (nama as string).trim(),
      email: typeof email === "string" && email.trim() ? email.trim() : null,
      role: parseRole(formData.get("role")),
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
