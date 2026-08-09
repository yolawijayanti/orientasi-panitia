import { Fragment } from "react";

import {
  buildGanttWeeks,
  formatRentangTanggal,
  formatTanggal,
  getMilestoneStatus,
  getWeekStart,
  STATUS_LABEL,
  type MilestoneStatus,
} from "@/lib/timeline/format";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/components/timeline/timeline-section";

const GANTT_BAR_CLASSNAME: Record<MilestoneStatus, string> = {
  akan_datang: "border border-input bg-secondary",
  berlangsung: "bg-primary",
  lewat: "bg-muted",
};

export function TimelineGantt({
  milestones,
  todayIso,
}: {
  milestones: Milestone[];
  todayIso: string;
}) {
  const weeks = buildGanttWeeks(milestones);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div
          className="grid w-max gap-1"
          style={{
            gridTemplateColumns: `minmax(160px, 220px) repeat(${weeks.length}, minmax(72px, 1fr))`,
          }}
        >
          <div style={{ gridRow: 1, gridColumn: 1 }} />
          {weeks.map((week, weekIndex) => (
            <div
              key={week.weekStart}
              style={{ gridRow: 1, gridColumn: weekIndex + 2 }}
              className="flex flex-col items-center pb-2 text-center"
              title={`${formatTanggal(week.weekStart)} – ${formatTanggal(week.weekEnd)}`}
            >
              <span className="text-xs font-medium">Minggu {weekIndex + 1}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatTanggal(week.weekStart)}
              </span>
            </div>
          ))}

          {milestones.map((milestone, rowIndex) => {
            const gridRow = rowIndex + 2;
            const startIndex = weeks.findIndex(
              (week) => week.weekStart === getWeekStart(milestone.tanggal_mulai),
            );
            const endIndex = weeks.findIndex(
              (week) =>
                week.weekStart ===
                getWeekStart(milestone.tanggal_selesai ?? milestone.tanggal_mulai),
            );
            const status = getMilestoneStatus(
              milestone.tanggal_mulai,
              milestone.tanggal_selesai,
              todayIso,
            );

            return (
              <Fragment key={milestone.id}>
                <div
                  style={{ gridRow, gridColumn: 1 }}
                  className="flex items-center truncate py-2 text-sm font-medium"
                  title={milestone.nama_milestone}
                >
                  {milestone.nama_milestone}
                </div>
                <div
                  style={{ gridRow, gridColumn: `${startIndex + 2} / ${endIndex + 3}` }}
                  className={cn("my-2 h-5 rounded-full", GANTT_BAR_CLASSNAME[status])}
                  title={`${milestone.nama_milestone}: ${formatRentangTanggal(
                    milestone.tanggal_mulai,
                    milestone.tanggal_selesai,
                  )}`}
                />
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(Object.keys(STATUS_LABEL) as MilestoneStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded-full", GANTT_BAR_CLASSNAME[status])} />
            {STATUS_LABEL[status]}
          </div>
        ))}
      </div>
    </div>
  );
}
