"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type CreateKepanitiaanState = { error?: string };

export async function createKepanitiaan(
  _prevState: CreateKepanitiaanState,
  formData: FormData,
): Promise<CreateKepanitiaanState> {
  const nama = formData.get("nama");
  if (typeof nama !== "string" || !nama.trim()) {
    return { error: "Nama kepanitiaan wajib diisi." };
  }

  const existingSiteNames = formData
    .getAll("site_names")
    .filter((value): value is string => typeof value === "string");

  const newSiteNamesRaw = formData.get("new_site_names");
  const newSiteNames =
    typeof newSiteNamesRaw === "string"
      ? newSiteNamesRaw
          .split(/[,\n]/)
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

  const namaSites = Array.from(new Set([...existingSiteNames, ...newSiteNames]));

  if (namaSites.length === 0) {
    return { error: "Pilih atau tambahkan minimal satu site." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_kepanitiaan_dengan_sites", {
    p_nama: nama.trim(),
    p_nama_sites: namaSites,
  });

  if (error) {
    return { error: "Gagal menyimpan kepanitiaan. Coba lagi." };
  }

  revalidatePath("/leader/kepanitiaan");
  redirect("/leader/kepanitiaan");
}

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

/**
 * Hitung akun panitia yang masih menempel ke instance-instance ini.
 * Constraint `panitia_harus_punya_instance` menolak `on delete set null`
 * selama masih ada akun panitia yang terhubung, jadi lebih baik dicegat di
 * sini dengan pesan yang jelas daripada dilempar sebagai error database.
 */
async function hitungPanitiaTerhubung(
  supabase: Awaited<ReturnType<typeof createClient>>,
  instanceIds: string[],
): Promise<number> {
  if (instanceIds.length === 0) return 0;

  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .in("kepanitiaan_site_id", instanceIds);

  return count ?? 0;
}

export async function renameKepanitiaan(
  kepanitiaanId: string,
  redirectTo: string,
  formData: FormData,
) {
  const nama = formData.get("nama");
  if (typeof nama !== "string" || !nama.trim()) {
    withError(redirectTo, "Nama kepanitiaan wajib diisi.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("kepanitiaan")
    .update({ nama: (nama as string).trim() })
    .eq("id", kepanitiaanId);

  if (error) {
    withError(
      redirectTo,
      error.message.toLowerCase().includes("duplicate")
        ? "Sudah ada kepanitiaan lain dengan nama itu."
        : "Gagal mengubah nama kepanitiaan.",
    );
  }

  revalidatePath(redirectTo);
}

export async function deleteKepanitiaan(kepanitiaanId: string, redirectTo: string) {
  const supabase = await createClient();

  const { data: instances } = await supabase
    .from("kepanitiaan_site")
    .select("id")
    .eq("kepanitiaan_id", kepanitiaanId);

  const instanceIds = (instances ?? []).map((instance) => instance.id as string);
  const jumlahPanitia = await hitungPanitiaTerhubung(supabase, instanceIds);

  if (jumlahPanitia > 0) {
    withError(
      redirectTo,
      `Tidak bisa dihapus: masih ada ${jumlahPanitia} akun panitia yang terhubung ke kepanitiaan ini. Pindahkan atau hapus akunnya dulu lewat Supabase.`,
    );
  }

  const { error } = await supabase.from("kepanitiaan").delete().eq("id", kepanitiaanId);
  if (error) {
    withError(redirectTo, "Gagal menghapus kepanitiaan.");
  }

  revalidatePath(redirectTo);
}

export async function deleteInstance(instanceId: string) {
  const supabase = await createClient();
  const daftarPath = "/leader/kepanitiaan";

  const jumlahPanitia = await hitungPanitiaTerhubung(supabase, [instanceId]);
  if (jumlahPanitia > 0) {
    withError(
      `${daftarPath}/${instanceId}`,
      `Tidak bisa dihapus: masih ada ${jumlahPanitia} akun panitia yang terhubung ke instance ini. Pindahkan atau hapus akunnya dulu lewat Supabase.`,
    );
  }

  const { error } = await supabase.from("kepanitiaan_site").delete().eq("id", instanceId);
  if (error) {
    withError(`${daftarPath}/${instanceId}`, "Gagal menghapus instance ini.");
  }

  revalidatePath(daftarPath);
  redirect(daftarPath);
}
