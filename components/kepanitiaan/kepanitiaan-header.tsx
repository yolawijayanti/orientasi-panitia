"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileText, ImagePlus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import type { BudgetTemplate } from "@/lib/budget/template";

/**
 * Header satu master event (PON / FIND / Habiha ...). Terkunci secara
 * default: "Simpan Nama", "Hapus Kepanitiaan", dan form upload logo baru
 * muncul setelah klik Edit -- supaya daftar kepanitiaan terbaca sebagai
 * daftar, bukan kumpulan form yang ramai. Tombol "Budgeting Template" di
 * sampingnya punya panel toggle sendiri (independen dari panel Edit) --
 * template budgeting itu PER EVENT (tiap kepanitiaan bisa beda template),
 * jadi lebih pas nempel di header event ini daripada jadi 1 widget global.
 */
export function KepanitiaanHeader({
  nama,
  logoUrl,
  jumlahInstance,
  renameAction,
  deleteAction,
  uploadLogoAction,
  removeLogoAction,
  budgetTemplate,
  uploadBudgetTemplateAction,
  removeBudgetTemplateAction,
}: {
  nama: string;
  logoUrl: string | null;
  jumlahInstance: number;
  renameAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  uploadLogoAction: (formData: FormData) => Promise<void>;
  removeLogoAction: (formData: FormData) => Promise<void>;
  budgetTemplate: BudgetTemplate | null;
  uploadBudgetTemplateAction: (formData: FormData) => Promise<void>;
  removeBudgetTemplateAction: (formData: FormData) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleRename(formData: FormData) {
    await renameAction(formData);
    setIsEditing(false);
    setNotice("Nama kepanitiaan berhasil diperbarui.");
  }

  /**
   * Tutup panel edit + tampilkan konfirmasi setelah upload berhasil. Tanpa
   * ini, panel tetap terbuka dengan input file kosong ("No file chosen") dan
   * tidak ada tanda apapun bahwa uploadnya berhasil -- user tidak tahu
   * apakah harus mengulang atau sudah selesai.
   *
   * Kalau upload GAGAL, server action memanggil redirect() yang melempar,
   * jadi baris di bawahnya tidak jalan dan pesan errornya muncul lewat
   * ?error= seperti biasa -- bukan sebagai notifikasi sukses palsu.
   */
  async function handleUpload(formData: FormData) {
    await uploadLogoAction(formData);
    setIsEditing(false);
    setNotice("Logo berhasil diperbarui.");
  }

  async function handleRemoveLogo(formData: FormData) {
    await removeLogoAction(formData);
    setIsEditing(false);
    setNotice("Logo berhasil dihapus.");
  }

  async function handleUploadTemplate(formData: FormData) {
    await uploadBudgetTemplateAction(formData);
    setIsBudgetOpen(false);
    setNotice("Template budgeting berhasil diperbarui.");
  }

  async function handleRemoveTemplate(formData: FormData) {
    await removeBudgetTemplateAction(formData);
    setIsBudgetOpen(false);
    setNotice("Template budgeting berhasil dihapus.");
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

        <div className="flex gap-2">
          {!isBudgetOpen && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setNotice(null);
                setIsBudgetOpen(true);
              }}
            >
              <FileText className="size-3.5" />
              Budgeting Template
            </Button>
          )}
          {!isEditing && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setNotice(null);
                setIsEditing(true);
              }}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <p className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0" />
          {notice}
        </p>
      )}

      {isBudgetOpen && (
        <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Template Budgeting untuk {nama}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsBudgetOpen(false)}>
              Tutup
            </Button>
          </div>

          {budgetTemplate ? (
            <a
              href={budgetTemplate.url}
              download
              className="flex items-center gap-2 text-sm text-primary underline underline-offset-2"
            >
              <Download className="size-4 shrink-0" />
              {budgetTemplate.name}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada template untuk event ini.</p>
          )}

          <form action={handleUploadTemplate} className="flex flex-wrap items-end gap-2 border-t pt-3">
            <div className="flex min-w-56 flex-1 flex-col gap-1">
              <Label htmlFor={`budget-template-${nama}`}>
                {budgetTemplate ? "Ganti Template" : "Upload Template"} (PDF/Excel/Word, maks 10 MB)
              </Label>
              <Input
                id={`budget-template-${nama}`}
                name="template"
                type="file"
                accept=".pdf,.xls,.xlsx,.doc,.docx"
                required
                className="h-auto py-1.5 file:mr-2 file:rounded file:border file:px-2 file:py-0.5"
              />
            </div>
            <SubmitButton size="sm" pendingLabel="Mengunggah…">
              {budgetTemplate ? "Ganti" : "Upload"}
            </SubmitButton>
            {budgetTemplate && (
              <ConfirmSubmitButton
                size="sm"
                variant="outline"
                formAction={handleRemoveTemplate}
                confirmMessage={`Hapus template budgeting untuk "${nama}"?`}
              >
                Hapus
              </ConfirmSubmitButton>
            )}
          </form>
        </div>
      )}

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

          <form action={handleUpload} className="flex flex-wrap items-end gap-2 border-t pt-3">
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
                formAction={handleRemoveLogo}
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
