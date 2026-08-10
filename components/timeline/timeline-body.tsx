"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MilestoneRow } from "@/components/timeline/milestone-row";
import { TimelineGantt } from "@/components/timeline/timeline-gantt";
import type { Milestone } from "@/components/timeline/timeline-section";

type MilestoneWithActions = {
  milestone: Milestone;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function TimelineBody({
  items,
  todayIso,
}: {
  items: MilestoneWithActions[];
  todayIso: string;
}) {
  // Default ke Gantt (tab "Mingguan") -- itu tampilan yang paling sering dipakai
  // saat meninjau timeline; tab Vertikal tetap ada untuk edit per milestone.
  const [view, setView] = useState<"vertikal" | "mingguan">("mingguan");

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada milestone.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={view === "vertikal" ? "default" : "outline"}
          onClick={() => setView("vertikal")}
        >
          Vertikal
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "mingguan" ? "default" : "outline"}
          onClick={() => setView("mingguan")}
        >
          Mingguan
        </Button>
      </div>

      {view === "vertikal" ? (
        <div className="flex flex-col">
          {items.map(({ milestone, updateAction, deleteAction }, index) => (
            <div key={milestone.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="mt-4 size-3 shrink-0 rounded-full bg-primary" />
                {index !== items.length - 1 && <span className="w-px flex-1 bg-border" />}
              </div>
              <div className="mb-4 flex-1">
                <MilestoneRow
                  milestone={milestone}
                  todayIso={todayIso}
                  updateAction={updateAction}
                  deleteAction={deleteAction}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <TimelineGantt
          milestones={items.map((item) => item.milestone)}
          todayIso={todayIso}
        />
      )}
    </div>
  );
}
