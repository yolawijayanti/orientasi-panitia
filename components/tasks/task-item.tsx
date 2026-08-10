import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { SubtaskRow, type Subtask } from "@/components/tasks/subtask-row";
import { addSubtask, updateTask, deleteTask, type ItemStatus } from "@/lib/tasks/actions";
import { STATUS_BADGE_VARIANT, STATUS_LABEL, formatDeadline } from "@/lib/tasks/format";
import { NATIVE_SELECT_CLASSNAME } from "@/lib/utils";

export type Task = {
  id: string;
  judul: string;
  deadline: string | null;
  status: ItemStatus;
};

export function TaskItem({
  task,
  subtasks,
  currentPath,
}: {
  task: Task;
  subtasks: Subtask[];
  currentPath: string;
}) {
  const updateAction = updateTask.bind(null, task.id, currentPath);
  const deleteAction = deleteTask.bind(null, task.id, currentPath);
  const addSubtaskAction = addSubtask.bind(null, task.id, currentPath);
  const subtaskSelesai = subtasks.filter((subtask) => subtask.status === "selesai").length;

  return (
    <details className="rounded-md border p-3">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{task.judul}</span>
          <Badge variant={STATUS_BADGE_VARIANT[task.status]}>{STATUS_LABEL[task.status]}</Badge>
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDeadline(task.deadline)}
          {subtasks.length > 0 && ` · ${subtaskSelesai}/${subtasks.length} subtugas selesai`}
        </span>
      </summary>

      <div className="mt-3 flex flex-col gap-4 border-t pt-3">
        <div className="flex flex-wrap items-end gap-2">
          <form action={updateAction} className="flex flex-1 flex-wrap items-end gap-2">
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
            <div className="flex flex-col gap-1">
              <Label htmlFor={`tugas-status-${task.id}`}>Status</Label>
              <select
                id={`tugas-status-${task.id}`}
                name="status"
                defaultValue={task.status}
                className={NATIVE_SELECT_CLASSNAME}
              >
                <option value="belum">Belum</option>
                <option value="proses">Proses</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Simpan
            </Button>
          </form>
          <form action={deleteAction}>
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              confirmMessage={`Hapus tugas "${task.judul}"? Subtugas di dalamnya ikut terhapus.`}
            >
              Hapus Tugas
            </ConfirmSubmitButton>
          </form>
        </div>

        <div className="flex flex-col gap-2 border-t pt-3">
          <p className="text-sm font-medium">Subtugas</p>
          {subtasks.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada subtugas.</p>
          )}
          {subtasks.map((subtask) => (
            <SubtaskRow key={subtask.id} subtask={subtask} currentPath={currentPath} />
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
            <Button type="submit" size="sm">
              + Tambah Subtugas
            </Button>
          </form>
        </div>
      </div>
    </details>
  );
}
