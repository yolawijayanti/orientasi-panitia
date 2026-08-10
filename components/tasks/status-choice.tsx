import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/tasks/actions";
import { STATUS_CHIP_CLASSNAME, STATUS_LABEL, STATUS_ORDER } from "@/lib/tasks/format";

/**
 * Single-choice status sebagai radio chip: ketiga pilihan kelihatan sekaligus
 * tanpa buka dropdown, dan yang aktif langsung kebaca dari warnanya. Tetap
 * radio HTML biasa (peer + peer-checked), jadi nol client-side JS.
 *
 * Sengaja pakai <div>, BUKAN <fieldset>/<legend>: fieldset punya aturan
 * layout sendiri (min-inline-size: min-content, dan legend dirender di luar
 * flow normal) yang bikin dia tidak mau menyusut di dalam baris flex --
 * akibatnya elemen setelahnya (tombol Simpan) bisa terdorong keluar area
 * yang bisa diklik.
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
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">Status</span>
      <div className="flex flex-wrap gap-1">
        {STATUS_ORDER.map((status) => {
          const id = `${idPrefix}-status-${status}`;
          return (
            <div key={status} className="relative">
              <input
                type="radio"
                id={id}
                name={name}
                value={status}
                defaultChecked={status === value}
                className="peer absolute size-0 opacity-0"
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
    </div>
  );
}
