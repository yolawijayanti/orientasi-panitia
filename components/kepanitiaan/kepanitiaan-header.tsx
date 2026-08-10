"use client";

import { useState } from "react";
import { ImagePlus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

/**
 * Header satu master event (PON / FIND / Habiha ...). Terkunci secara
 * default: "Simpan Nama", "Hapus Kepanitiaan", dan form upload logo baru
 * muncul setelah klik Edit -- supaya daftar kepanitiaan terbaca sebagai
 * daftar, bukan kumpulan form yang ramai.
 */
export function KepanitiaanHeader({
  nama,
  logoUrl,
  jumlahInstance,
  renameAction,
  deleteAction,
  uploadLogoAction,
  removeLogoAction,
}: {
  nama: string;
  logoUrl: string | null;
  jumlahInstance: number;
  renameAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  uploadLogoAction: (formData: FormData) => Promise<void>;
  removeLogoAction: (formData: FormData) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleRename(formData: FormData) {
    await renameAction(formData);
    setIsEditing(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // URL-nya dari Supabase Storage dan berubah per kepanitiaan;
            // next/image butuh remotePatterns yang di-hardcode ke host project,
            // jadi <img> polos lebih tepat di sini.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`Logo ${nama}`}
              className="size-16 shrink-0 rounded-md border object-cover"
            />
          ) : (
            <div className="flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border-2 border-dashed text-muted-foreground">
              <ImagePlus className="size-5" />
              <span className="text-[9px] leading-none">PNG/JPG</span>
            </div>
          )}

          <div className="flex flex-col">
            <h2 className="text-2xl font-bold tracking-tight">{nama}</h2>
            <span className="text-xs text-muted-foreground">
              Master event · {jumlahInstance} site
            </span>
          </div>
        </div>

        {!isEditing && (
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-3">
          <form action={handleRename} className="flex flex-wrap items-end gap-2">
            <div className="flex min-w-56 flex-1 flex-col gap-1">
              <Label htmlFor={`nama-kepanitiaan-${nama}`}>Nama Kepanitiaan</Label>
              <Input
                id={`nama-kepanitiaan-${nama}`}
                name="nama"
                defaultValue={nama}
                className="font-semibold"
                required
              />
            </div>
            <SubmitButton size="sm">Simpan Nama</SubmitButton>
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Batal
            </Button>
          </form>

          <form action={uploadLogoAction} className="flex flex-wrap items-end gap-2 border-t pt-3">
            <div className="flex min-w-56 flex-1 flex-col gap-1">
              <Label htmlFor={`logo-${nama}`}>Logo (PNG / JPG, maks 2 MB)</Label>
              <Input
                id={`logo-${nama}`}
                name="logo"
                type="file"
                accept="image/png,image/jpeg"
                required
                className="h-auto py-1.5 file:mr-2 file:rounded file:border file:px-2 file:py-0.5"
              />
            </div>
            <SubmitButton size="sm" pendingLabel="Mengunggah…">
              Upload Logo
            </SubmitButton>
            {logoUrl && (
              <ConfirmSubmitButton
                size="sm"
                variant="outline"
                formAction={removeLogoAction}
                confirmMessage={`Hapus logo "${nama}"?`}
              >
                Hapus Logo
              </ConfirmSubmitButton>
            )}
          </form>

          <form action={deleteAction} className="border-t pt-3">
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              confirmMessage={`Hapus kepanitiaan "${nama}" beserta ${jumlahInstance} instance site-nya? Semua susunan panitia, bucket, dan tugas di dalamnya ikut terhapus permanen.`}
            >
              Hapus Kepanitiaan
            </ConfirmSubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
