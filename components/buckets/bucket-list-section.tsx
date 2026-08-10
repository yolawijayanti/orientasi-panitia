import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BucketBoard, type BoardTask } from "@/components/buckets/bucket-board";
import { ProgressRing } from "@/components/buckets/progress-ring";
import { addBucket } from "@/lib/buckets/actions";
import type { Progress } from "@/lib/tasks/progress";

export type BucketSummary = {
  id: string;
  nama_bidang: string;
  is_budgeting: boolean;
};

export type { BoardTask };

/**
 * Satu blok gabungan: ring "Progres Kepanitiaan Ini" di paling kiri, lalu
 * Task Board di sebelah kanannya. Digabung karena keduanya membaca angka yang
 * sama -- kalau dipisah jadi dua card, ring-nya kelihatan seperti ringkasan
 * yang tidak berhubungan dengan board di bawahnya.
 */
export function BucketListSection({
  kepanitiaanSiteId,
  buckets,
  tasksByBucket,
  progressByBucket,
  memberNameById,
  masterProgress,
  bucketSelesai,
  basePath,
  currentPath,
  error,
}: {
  kepanitiaanSiteId: string;
  buckets: BucketSummary[];
  tasksByBucket: Record<string, BoardTask[]>;
  progressByBucket: Record<string, Progress>;
  memberNameById: Record<string, string>;
  masterProgress: Progress;
  bucketSelesai: number;
  basePath: string;
  currentPath: string;
  error?: string;
}) {
  const addAction = addBucket.bind(null, kepanitiaanSiteId, currentPath);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex shrink-0 flex-col items-center gap-2 lg:w-56">
          <h3 className="text-sm font-semibold">Progres Kepanitiaan Ini</h3>
          <ProgressRing percent={masterProgress.percent} />
          <p className="text-center text-xs text-muted-foreground">
            {masterProgress.done}/{masterProgress.total} tugas &amp; subtugas selesai
            <br />
            {bucketSelesai} dari {buckets.length} bidang sudah 100%
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <h3 className="text-sm font-semibold">Task Board</h3>
          {buckets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada bidang tugas.</p>
          ) : (
            <BucketBoard
              buckets={buckets}
              tasksByBucket={tasksByBucket}
              progressByBucket={progressByBucket}
              memberNameById={memberNameById}
              basePath={basePath}
            />
          )}

          <form action={addAction} className="flex flex-wrap items-end gap-2 border-t pt-4">
            <div className="flex min-w-40 flex-1 flex-col gap-1">
              <Label htmlFor="nama-bidang-baru">Bidang Tugas</Label>
              <Input id="nama-bidang-baru" name="nama_bidang" required />
            </div>
            <Button type="submit" size="sm">
              + Tambah Bidang
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
