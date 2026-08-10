import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/buckets/progress-bar";
import { STATUS_CHIP_CLASSNAME, STATUS_LABEL, formatDeadline } from "@/lib/tasks/format";
import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/tasks/actions";
import type { Progress } from "@/lib/tasks/progress";
import type { BucketSummary } from "@/components/buckets/bucket-list-section";

export type BoardTask = {
  id: string;
  bucket_id: string;
  judul: string;
  deadline: string | null;
  status: ItemStatus;
  assignee_id: string | null;
  subtaskTotal: number;
  subtaskDone: number;
};

/**
 * Board gaya Trello: tiap bucket jadi satu kolom vertikal, tugas jadi kartu
 * yang menumpuk ke bawah di dalam kolomnya. Board-nya read-only (ringkasan
 * saja) -- CRUD tugas tetap di halaman detail bucket, supaya board ini tidak
 * perlu drag-and-drop atau client-side JS sama sekali.
 */
export function BucketBoard({
  buckets,
  tasksByBucket,
  progressByBucket,
  memberNameById,
  basePath,
}: {
  buckets: BucketSummary[];
  tasksByBucket: Record<string, BoardTask[]>;
  progressByBucket: Record<string, Progress>;
  memberNameById: Record<string, string>;
  basePath: string;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {buckets.map((bucket) => {
        const progress = progressByBucket[bucket.id] ?? { total: 0, done: 0, percent: 0 };
        const tasks = tasksByBucket[bucket.id] ?? [];

        return (
          <div
            key={bucket.id}
            className="flex w-72 shrink-0 flex-col gap-2 rounded-lg border bg-muted/40 p-3"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`${basePath}/${bucket.id}`}
                  className="text-sm font-semibold hover:underline"
                >
                  {bucket.nama_bidang}
                </Link>
                {bucket.is_budgeting && (
                  <Badge variant="outline" className="shrink-0">
                    budgeting
                  </Badge>
                )}
              </div>
              <ProgressBar percent={progress.percent} />
              <span className="text-xs text-muted-foreground">
                {progress.percent}% · {progress.done}/{progress.total} selesai
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {tasks.length === 0 && (
                <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Belum ada tugas
                </p>
              )}
              {tasks.map((task) => {
                const assigneeName = task.assignee_id
                  ? memberNameById[task.assignee_id]
                  : undefined;

                return (
                  <Link
                    key={task.id}
                    href={`${basePath}/${bucket.id}`}
                    className="flex flex-col gap-1.5 rounded-md border bg-card p-2.5 shadow-sm hover:border-ring"
                  >
                    <span className="text-sm font-medium">{task.judul}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          STATUS_CHIP_CLASSNAME[task.status],
                        )}
                      >
                        {STATUS_LABEL[task.status]}
                      </span>
                      {task.subtaskTotal > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {task.subtaskDone}/{task.subtaskTotal} subtugas
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-muted-foreground">
                      <span>{formatDeadline(task.deadline)}</span>
                      {assigneeName && (
                        <span className="rounded-full bg-secondary px-1.5 py-0.5">
                          {assigneeName}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link
              href={`${basePath}/${bucket.id}`}
              className="mt-auto pt-1 text-xs text-muted-foreground hover:underline"
            >
              + Kelola tugas bidang ini
            </Link>
          </div>
        );
      })}
    </div>
  );
}
