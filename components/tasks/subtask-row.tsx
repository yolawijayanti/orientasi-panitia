import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssigneeSelect, type AssignableMember } from "@/components/tasks/assignee-select";
import { StatusChoice } from "@/components/tasks/status-choice";
import { updateSubtask, deleteSubtask, type ItemStatus } from "@/lib/tasks/actions";

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
  currentPath,
}: {
  subtask: Subtask;
  members: AssignableMember[];
  currentPath: string;
}) {
  const updateAction = updateSubtask.bind(null, subtask.id, currentPath);
  const deleteAction = deleteSubtask.bind(null, subtask.id, currentPath);

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border p-2">
      <form action={updateAction} className="flex flex-1 flex-wrap items-end gap-2">
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
      </form>
      <form action={deleteAction}>
        <Button type="submit" size="sm" variant="destructive">
          Hapus
        </Button>
      </form>
    </div>
  );
}
