import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/buckets/progress-ring";
import { ProgressBar } from "@/components/buckets/progress-bar";
import { BUDGET_STATUS_LABEL, BUDGET_STATUS_BADGE_CLASSNAME } from "@/lib/budget/format";
import { cn } from "@/lib/utils";
import type { InstanceOverview } from "@/lib/dashboard/leader-overview";

/**
 * Satu kolom perbandingan di Dashboard Kepanitiaan -- lebar tetap (`w-72`)
 * supaya beberapa instance terpilih bisa disejajarkan side-by-side di dalam
 * baris `overflow-x-auto`, pola yang sama seperti kolom `BucketBoard`
 * (Fase 4) dan bar Gantt (Fase 3).
 */
export function InstanceOverviewCard({ overview }: { overview: InstanceOverview }) {
  return (
    <Card className="w-72 shrink-0">
      <CardHeader>
        <CardTitle className="text-base">{overview.kepanitiaanNama}</CardTitle>
        <p className="text-xs text-muted-foreground">@ {overview.siteNama}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-1">
          <ProgressRing percent={overview.masterProgress.percent} size={96} strokeWidth={9} />
          <span className="text-xs text-muted-foreground">
            {overview.masterProgress.done}/{overview.masterProgress.total} tugas &amp; subtugas
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-sm font-medium">Budgeting</span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
              BUDGET_STATUS_BADGE_CLASSNAME[overview.budgetStatus],
            )}
          >
            {BUDGET_STATUS_LABEL[overview.budgetStatus]}
          </span>
        </div>

        <div className="flex flex-col gap-2 border-t pt-3">
          <span className="text-sm font-medium">Progres per Bidang</span>
          {overview.bucketProgress.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada bidang.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {overview.bucketProgress.map((bucket) => (
                <li key={bucket.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{bucket.namaBidang}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {bucket.progress.percent}%
                    </span>
                  </div>
                  <ProgressBar percent={bucket.progress.percent} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button asChild size="sm" variant="outline" className="w-fit">
          <Link href={`/leader/kepanitiaan/${overview.id}`}>Buka Instance →</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
