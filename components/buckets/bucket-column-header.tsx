"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ProgressBar } from "@/components/buckets/progress-bar";
import type { Progress } from "@/lib/tasks/progress";

/**
 * Header satu kolom bidang di Task Board, dengan tombol Edit untuk ganti
 * nama / hapus bidang. Tombolnya sengaja selalu ada (tidak cuma muncul saat
 * hover) supaya bidang yang masih kosong -- yang badannya tidak punya kartu
 * apapun untuk diklik -- tetap bisa dikelola.
 */
export function BucketColumnHeader({
  namaBidang,
  isBudgeting,
  href,
  progress,
  renameAction,
  deleteAction,
}: {
  namaBidang: string;
  isBudgeting: boolean;
  href: string;
  progress: Progress;
  renameAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleRename(formData: FormData) {
    await renameAction(formData);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <form action={handleRename} className="flex flex-col gap-2">
          <Input
            name="nama_bidang"
            defaultValue={namaBidang}
            aria-label="Nama bidang"
            className="h-8 font-semibold"
            required
          />
          <div className="flex flex-wrap gap-1">
            <SubmitButton size="sm">Simpan</SubmitButton>
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Batal
            </Button>
          </div>
        </form>
        {!isBudgeting && (
          <form action={deleteAction}>
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              className="w-full"
              confirmMessage={`Hapus bidang "${namaBidang}"? Semua tugas & subtugas di dalamnya ikut terhapus permanen.`}
            >
              Hapus Bidang
            </ConfirmSubmitButton>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-1">
        <Link href={href} className="text-sm font-semibold hover:underline">
          {namaBidang}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          {isBudgeting && <Badge variant="outline">budgeting</Badge>}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label={`Edit bidang ${namaBidang}`}
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      </div>
      <ProgressBar percent={progress.percent} />
      <span className="text-xs text-muted-foreground">
        {progress.percent}% · {progress.done}/{progress.total} selesai
      </span>
    </div>
  );
}
