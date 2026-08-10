import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/tasks/actions";
import { STATUS_CHIP_CLASSNAME, STATUS_LABEL, STATUS_ORDER } from "@/lib/tasks/format";

/**
 * Single-choice status sebagai radio chip, bukan <select> -- ketiga pilihan
 * kelihatan sekaligus tanpa perlu buka dropdown, dan yang aktif langsung
 * kebaca dari warnanya. Tetap radio HTML biasa (peer + peer-checked), jadi
 * masih nol client-side JS seperti sisa section tugas.
 */
export function StatusChoice({
  name = "status",
  value,
  idPrefix,
}: {
  name?: string;
  value: ItemStatus;
  idPrefix: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm font-medium">Status</legend>
      <div className="flex flex-wrap gap-1">
        {STATUS_ORDER.map((status) => {
          const id = `${idPrefix}-status-${status}`;
          return (
            <div key={status}>
              <input
                type="radio"
                id={id}
                name={name}
                value={status}
                defaultChecked={status === value}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm",
                  "opacity-60 hover:opacity-100",
                  "peer-checked:font-medium peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-ring/50",
                  STATUS_CHIP_CLASSNAME[status],
                )}
              >
                {STATUS_LABEL[status]}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
