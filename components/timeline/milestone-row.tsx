"use client";

import { useState } from "react";
import { Lock, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatRentangTanggal,
  getMilestoneStatus,
  STATUS_BADGE_VARIANT,
  STATUS_LABEL,
} from "@/lib/timeline/format";
import type { Milestone } from "@/components/timeline/timeline-section";

export function MilestoneRow({
  milestone,
  todayIso,
  updateAction,
  deleteAction,
}: {
  milestone: Milestone;
  todayIso: string;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSave(formData: FormData) {
    await updateAction(formData);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form action={handleSave} className="flex flex-1 flex-wrap items-end gap-2 rounded-md border p-3">
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <Label htmlFor={`nama-${milestone.id}`}>Nama Milestone</Label>
          <Input
            id={`nama-${milestone.id}`}
            name="nama_milestone"
            defaultValue={milestone.nama_milestone}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`mulai-${milestone.id}`}>Tanggal Mulai</Label>
          <Input
            id={`mulai-${milestone.id}`}
            name="tanggal_mulai"
            type="date"
            defaultValue={milestone.tanggal_mulai}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`selesai-${milestone.id}`}>Tanggal Selesai</Label>
          <Input
            id={`selesai-${milestone.id}`}
            name="tanggal_selesai"
            type="date"
            defaultValue={milestone.tanggal_selesai ?? ""}
          />
        </div>
        <Button type="submit" size="sm" variant="secondary">
          Simpan
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
          Batal
        </Button>
      </form>
    );
  }

  const status = getMilestoneStatus(milestone.tanggal_mulai, milestone.tanggal_selesai, todayIso);

  return (
    <div className="flex flex-1 flex-wrap items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Lock className="size-3.5 text-muted-foreground" aria-label="Tanggal terkunci, klik Edit untuk mengubah" />
          <span className="font-medium">{milestone.nama_milestone}</span>
          <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatRentangTanggal(milestone.tanggal_mulai, milestone.tanggal_selesai)}
        </span>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <form action={deleteAction}>
          <ConfirmSubmitButton
            size="sm"
            variant="destructive"
            confirmMessage={`Hapus milestone "${milestone.nama_milestone}"?`}
          >
            Hapus
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
