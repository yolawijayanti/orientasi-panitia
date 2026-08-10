import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/buckets/progress-bar";
import { TaskItem, type Task } from "@/components/tasks/task-item";
import type { Subtask } from "@/components/tasks/subtask-row";
import { addTask } from "@/lib/tasks/actions";
import { computeProgress } from "@/lib/tasks/progress";

export type { Task, Subtask };

export function BucketTasksSection({
  bucketId,
  tasks,
  subtasksByTask,
  currentPath,
  error,
}: {
  bucketId: string;
  tasks: Task[];
  subtasksByTask: Record<string, Subtask[]>;
  currentPath: string;
  error?: string;
}) {
  const allStatuses = [
    ...tasks.map((task) => task.status),
    ...Object.values(subtasksByTask)
      .flat()
      .map((subtask) => subtask.status),
  ];
  const progress = computeProgress(allStatuses);
  const addTaskAction = addTask.bind(null, bucketId, currentPath);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Tugas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress bucket</span>
            <span>
              {progress.done}/{progress.total} tugas & subtugas selesai
            </span>
          </div>
          <ProgressBar percent={progress.percent} />
        </div>

        <div className="flex flex-col gap-3">
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada tugas.</p>
          )}
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              subtasks={subtasksByTask[task.id] ?? []}
              currentPath={currentPath}
            />
          ))}
        </div>

        <form action={addTaskAction} className="flex flex-wrap items-end gap-2 border-t pt-4">
          <div className="flex min-w-40 flex-1 flex-col gap-1">
            <Label htmlFor="tugas-judul-baru">Nama Tugas</Label>
            <Input id="tugas-judul-baru" name="judul" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="tugas-deadline-baru">Deadline</Label>
            <Input id="tugas-deadline-baru" name="deadline" type="date" />
          </div>
          <Button type="submit" size="sm">
            + Tambah Tugas
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
