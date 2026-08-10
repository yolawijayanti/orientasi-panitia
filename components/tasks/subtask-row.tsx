"use client";

import { useState } from "react";
import { CheckCircle2, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AssigneeSelect, type AssignableMember } from "@/components/tasks/assignee-select";
import { StatusChoice } from "@/components/tasks/status-choice";
import type { ItemStatus } from "@/lib/tasks/actions";
import { formatDeadline } from "@/lib/tasks/format";
import { StatusPill } from "@/components/tasks/status-pill";
import { useSaveFlash } from "@/lib/hooks/use-save-flash";
import { cn } from "@/lib/utils";

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
  const [justSaved, flashSaved] = useSaveFlash();

  async function handleSave(formData: FormData) {
    await updateAction(formData);
    setIsEditing(false);
    flashSaved();
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
        <SubmitButton size="sm">Simpan</SubmitButton>
        <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
          Batal
        </Button>
      </form>
    );
  }

  const assignee = members.find((member) => member.id === subtask.assignee_id);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-md border p-2.5 transition-colors",
        justSaved && "border-green-400 bg-green-50 dark:bg-green-950",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm">{subtask.judul}</span>
        <StatusPill status={subtask.status} />
        {assignee && <Badge variant="outline">{assignee.nama}</Badge>}
        <span className="text-xs text-muted-foreground">{formatDeadline(subtask.deadline)}</span>
        {justSaved && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300">
            <CheckCircle2 className="size-3.5" />
            Tersimpan
          </span>
        )}
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
