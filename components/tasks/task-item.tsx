"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { SubtaskRow, type Subtask } from "@/components/tasks/subtask-row";
import { AssigneeSelect, type AssignableMember } from "@/components/tasks/assignee-select";
import { StatusChoice } from "@/components/tasks/status-choice";
import type { ItemStatus } from "@/lib/tasks/actions";
import { formatDeadline } from "@/lib/tasks/format";
import { StatusPill } from "@/components/tasks/status-pill";
import { useSaveFlash } from "@/lib/hooks/use-save-flash";
import { cn } from "@/lib/utils";

export type Task = {
  id: string;
  judul: string;
  deadline: string | null;
  status: ItemStatus;
  assignee_id: string | null;
};

export type SubtaskWithActions = {
  subtask: Subtask;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function TaskItem({
  task,
  subtasks,
  members,
  updateAction,
  deleteAction,
  addSubtaskAction,
}: {
  task: Task;
  subtasks: SubtaskWithActions[];
  members: AssignableMember[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  addSubtaskAction: (formData: FormData) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [justSaved, flashSaved] = useSaveFlash();

  async function handleSave(formData: FormData) {
    await updateAction(formData);
    setIsEditing(false);
    flashSaved();
  }

  const subtaskSelesai = subtasks.filter((item) => item.subtask.status === "selesai").length;
  const assignee = members.find((member) => member.id === task.assignee_id);

  return (
    <div
      className={cn(
        "rounded-md border p-3 transition-colors",
        justSaved && "border-green-400 bg-green-50 dark:bg-green-950",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="flex flex-1 flex-wrap items-center gap-2 text-left"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="font-medium">{task.judul}</span>
          <StatusPill status={task.status} />
          {assignee && <Badge variant="outline">{assignee.nama}</Badge>}
          <span className="text-xs text-muted-foreground">
            {formatDeadline(task.deadline)}
            {subtasks.length > 0 && ` · ${subtaskSelesai}/${subtasks.length} subtugas selesai`}
          </span>
          {justSaved && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300">
              <CheckCircle2 className="size-3.5" />
              Tersimpan
            </span>
          )}
        </button>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="size-3.5" />
            Update Tugas
          </Button>
          <form action={deleteAction}>
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              confirmMessage={`Hapus tugas "${task.judul}"? Subtugas di dalamnya ikut terhapus.`}
            >
              Hapus
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {isEditing && (
        <form action={handleSave} className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
          <div className="flex min-w-40 flex-1 flex-col gap-1">
            <Label htmlFor={`tugas-judul-${task.id}`}>Nama Tugas</Label>
            <Input id={`tugas-judul-${task.id}`} name="judul" defaultValue={task.judul} required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`tugas-deadline-${task.id}`}>Deadline</Label>
            <Input
              id={`tugas-deadline-${task.id}`}
              name="deadline"
              type="date"
              defaultValue={task.deadline ?? ""}
            />
          </div>
          <AssigneeSelect members={members} value={task.assignee_id} idPrefix={`tugas-${task.id}`} />
          <StatusChoice value={task.status} idPrefix={`tugas-${task.id}`} />
          <SubmitButton size="sm">Simpan</SubmitButton>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            Batal
          </Button>
        </form>
      )}

      {isOpen && (
        <div className="mt-3 flex flex-col gap-2 border-t pt-3">
          <p className="text-sm font-medium">Subtugas</p>
          {subtasks.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada subtugas.</p>
          )}
          {subtasks.map(({ subtask, updateAction: update, deleteAction: remove }) => (
            <SubtaskRow
              key={subtask.id}
              subtask={subtask}
              members={members}
              updateAction={update}
              deleteAction={remove}
            />
          ))}

          <form action={addSubtaskAction} className="flex flex-wrap items-end gap-2 pt-2">
            <div className="flex min-w-32 flex-1 flex-col gap-1">
              <Label htmlFor={`subtugas-judul-baru-${task.id}`}>Nama Subtugas</Label>
              <Input id={`subtugas-judul-baru-${task.id}`} name="judul" required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`subtugas-deadline-baru-${task.id}`}>Deadline</Label>
              <Input id={`subtugas-deadline-baru-${task.id}`} name="deadline" type="date" />
            </div>
            <AssigneeSelect members={members} value={null} idPrefix={`subtugas-baru-${task.id}`} />
            <SubmitButton size="sm" pendingLabel="Menambah…">
              + Tambah Subtugas
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
