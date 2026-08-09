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
    return {
      error: error.message.toLowerCase().includes("duplicate")
        ? "Nama kepanitiaan ini sudah dipakai."
        : "Gagal membuat kepanitiaan. Coba lagi.",
    };
  }

  revalidatePath("/leader/kepanitiaan");
  redirect("/leader/kepanitiaan");
}
