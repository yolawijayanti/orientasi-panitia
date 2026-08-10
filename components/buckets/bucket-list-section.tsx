import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/buckets/progress-bar";
import { addBucket } from "@/lib/buckets/actions";
import type { Progress } from "@/lib/tasks/progress";

export type BucketSummary = {
  id: string;
  nama_bidang: string;
  is_budgeting: boolean;
};

export function BucketListSection({
  kepanitiaanSiteId,
  buckets,
  progressByBucket,
  basePath,
  currentPath,
  error,
}: {
  kepanitiaanSiteId: string;
  buckets: BucketSummary[];
  progressByBucket: Record<string, Progress>;
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

        <div className="flex flex-col gap-3">
          {buckets.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada bucket.</p>
          )}
          {buckets.map((bucket) => {
            const progress = progressByBucket[bucket.id] ?? { total: 0, done: 0, percent: 0 };

            return (
              <Link
                key={bucket.id}
                href={`${basePath}/${bucket.id}`}
                className="flex flex-col gap-2 rounded-md border p-3 hover:bg-accent"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {bucket.nama_bidang}
                    {bucket.is_budgeting && (
                      <span className="ml-1 text-xs text-muted-foreground">(budgeting)</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {progress.done}/{progress.total} tugas & subtugas selesai
                  </span>
                </div>
                <ProgressBar percent={progress.percent} />
              </Link>
            );
          })}
        </div>

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
