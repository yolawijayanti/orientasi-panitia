import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/tasks/actions";
import { STATUS_CHIP_CLASSNAME, STATUS_LABEL } from "@/lib/tasks/format";

/** Kapsul status seragam: Assigned = pink, In Progress = kuning, Done = hijau. */
export function StatusPill({ status, className }: { status: ItemStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_CHIP_CLASSNAME[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
