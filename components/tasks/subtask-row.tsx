"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AssigneeSelect, type AssignableMember } from "@/components/tasks/assignee-select";
import { StatusChoice } from "@/components/tasks/status-choice";
import type { ItemStatus } from "@/lib/tasks/actions";
import { STATUS_BADGE_VARIANT, STATUS_LABEL, formatDeadline } from "@/lib/tasks/format";

export type Subtask = {
  id: string;
  task_id: string;
  judul: string;
  deadline: string | null;
  status: ItemStatus;
  assignee_id: string | null;
};

export function SubtaskRow({
  subtask,
  members,
  updateAction,
  deleteAction,
}: {
  subtask: Subtask;
  members: AssignableMember[];
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
      <form action={handleSave} className="flex flex-wrap items-end gap-2 rounded-md border p-3">
        <div className="flex min-w-32 flex-1 flex-col gap-1">
          <Label htmlFor={`subtugas-judul-${subtask.id}`}>Nama Subtugas</Label>
          <Input
            id={`subtugas-judul-${subtask.id}`}
            name="judul"
            defaultValue={subtask.judul}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`subtugas-deadline-${subtask.id}`}>Deadline</Label>
          <Input
            id={`subtugas-deadline-${subtask.id}`}
            name="deadline"
            type="date"
            defaultValue={subtask.deadline ?? ""}
          />
        </div>
        <AssigneeSelect
          members={members}
          value={subtask.assignee_id}
          idPrefix={`subtugas-${subtask.id}`}
        />
        <StatusChoice value={subtask.status} idPrefix={`subtugas-${subtask.id}`} />
        <Button type="submit" size="sm" variant="secondary">
          Simpan
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
          Batal
        </Button>
      </form>
    );
  }

  const assignee = members.find((member) => member.id === subtask.assignee_id);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm">{subtask.judul}</span>
        <Badge variant={STATUS_BADGE_VARIANT[subtask.status]}>
          {STATUS_LABEL[subtask.status]}
        </Badge>
        {assignee && <Badge variant="outline">{assignee.nama}</Badge>}
        <span className="text-xs text-muted-foreground">{formatDeadline(subtask.deadline)}</span>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          <Pencil className="size-3.5" />
          Update Subtugas
        </Button>
        <form action={deleteAction}>
          <ConfirmSubmitButton
            size="sm"
            variant="destructive"
            confirmMessage={`Hapus subtugas "${subtask.judul}"?`}
          >
            Hapus
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
