import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSubtask, deleteSubtask, type ItemStatus } from "@/lib/tasks/actions";
import { NATIVE_SELECT_CLASSNAME } from "@/lib/utils";

export type Subtask = {
  id: string;
  task_id: string;
  judul: string;
  deadline: string | null;
  status: ItemStatus;
};

export function SubtaskRow({ subtask, currentPath }: { subtask: Subtask; currentPath: string }) {
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
        <div className="flex flex-col gap-1">
          <Label htmlFor={`subtugas-status-${subtask.id}`}>Status</Label>
          <select
            id={`subtugas-status-${subtask.id}`}
            name="status"
            defaultValue={subtask.status}
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
        <Button type="submit" size="sm" variant="destructive">
          Hapus
        </Button>
      </form>
    </div>
  );
}
