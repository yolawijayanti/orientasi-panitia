"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const BUCKET = "kepanitiaan-logo";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
]);

function withError(redirectTo: string, message: string): never {
  redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
}

export async function uploadKepanitiaanLogo(
  kepanitiaanId: string,
  redirectTo: string,
  formData: FormData,
) {
  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    withError(redirectTo, "Pilih file gambar dulu sebelum menekan Upload.");
  }

  const ext = ALLOWED.get(file.type);
  if (!ext) {
    withError(redirectTo, "Format harus PNG atau JPG/JPEG.");
  }

  if (file.size > MAX_BYTES) {
    withError(redirectTo, "Ukuran file maksimal 2 MB.");
  }

  const supabase = await createClient();

  // Nama file di-generate dari id kepanitiaan, BUKAN dari nama file asli --
  // nama asli bisa mengandung karakter aneh/spasi dan bisa dipakai untuk
  // menimpa objek lain. Satu kepanitiaan = satu objek, jadi upload ulang
  // otomatis menggantikan yang lama (upsert) tanpa menumpuk file yatim.
  const path = `${kepanitiaanId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    withError(redirectTo, `Gagal mengunggah logo: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Query string versi dipakai untuk memaksa browser & CDN mengambil ulang
  // gambar setelah upload baru -- tanpa ini, path yang sama akan tetap
  // menampilkan logo lama dari cache.
  const versionedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("kepanitiaan")
    .update({ logo_url: versionedUrl })
    .eq("id", kepanitiaanId);

  if (updateError) {
    withError(redirectTo, "Logo terunggah tapi gagal disimpan ke kepanitiaan.");
  }

  revalidatePath(redirectTo);
}

export async function removeKepanitiaanLogo(kepanitiaanId: string, redirectTo: string) {
  const supabase = await createClient();

  // Hapus kedua kemungkinan ekstensi: kepanitiaan yang logonya pernah
  // diganti dari png ke jpg (atau sebaliknya) menyisakan objek lama, karena
  // path-nya ikut ekstensi.
  await supabase.storage
    .from(BUCKET)
    .remove([`${kepanitiaanId}.png`, `${kepanitiaanId}.jpg`]);

  const { error } = await supabase
    .from("kepanitiaan")
    .update({ logo_url: null })
    .eq("id", kepanitiaanId);

  if (error) {
    withError(redirectTo, "Gagal menghapus logo.");
  }

  revalidatePath(redirectTo);
}
