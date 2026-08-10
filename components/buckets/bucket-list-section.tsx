import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BucketBoard, type BoardTask } from "@/components/buckets/bucket-board";
import { addBucket } from "@/lib/buckets/actions";
import type { Progress } from "@/lib/tasks/progress";

export type BucketSummary = {
  id: string;
  nama_bidang: string;
  is_budgeting: boolean;
};

export type { BoardTask };

export function BucketListSection({
  kepanitiaanSiteId,
  buckets,
  tasksByBucket,
  progressByBucket,
  memberNameById,
  basePath,
  currentPath,
  error,
}: {
  kepanitiaanSiteId: string;
  buckets: BucketSummary[];
  tasksByBucket: Record<string, BoardTask[]>;
  progressByBucket: Record<string, Progress>;
  memberNameById: Record<string, string>;
  basePath: string;
  currentPath: string;
  error?: string;
}) {
  const addAction = addBucket.bind(null, kepanitiaanSiteId, currentPath);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bucket Kepanitiaan</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {buckets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada bucket.</p>
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
            <Label htmlFor="nama-bidang-baru">Nama Bidang</Label>
            <Input id="nama-bidang-baru" name="nama_bidang" required />
          </div>
          <Button type="submit" size="sm">
            + Tambah Bidang
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
