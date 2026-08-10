import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/buckets/progress-bar";
import type { Progress } from "@/lib/tasks/progress";

/**
 * Master progres satu instance kepanitiaan+site: gabungan semua tugas &
 * subtugas dari SEMUA bucket di instance itu, plus rincian berapa bucket
 * yang sudah 100%.
 */
export function MasterProgress({
  progress,
  totalBucket,
  bucketSelesai,
}: {
  progress: Progress;
  totalBucket: number;
  bucketSelesai: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Progres Instance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2">
          <span className="text-3xl font-semibold tabular-nums">{progress.percent}%</span>
          <span className="text-sm text-muted-foreground">
            {progress.done}/{progress.total} tugas &amp; subtugas selesai
          </span>
        </div>
        <ProgressBar percent={progress.percent} />
        <p className="text-sm text-muted-foreground">
          {bucketSelesai} dari {totalBucket} bidang sudah 100% selesai.
        </p>
      </CardContent>
    </Card>
  );
}
