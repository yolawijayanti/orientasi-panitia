import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstanceGroup } from "@/lib/dashboard/leader-overview";

/**
 * Checklist multi-select semua instance, dikelompokkan per kepanitiaan.
 * Form GET tanpa `action` -- browser submit ke URL halaman saat ini dengan
 * checkbox terpilih sebagai query string (`?instance=id1&instance=id2`),
 * jadi nol client-side JS, mengikuti pola form-driven-by-query-params yang
 * sudah dipakai di halaman lain (mis. `?error=...`).
 */
export function InstancePicker({
  groups,
  selectedIds,
}: {
  groups: InstanceGroup[];
  selectedIds: string[];
}) {
  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground">
        Belum ada kepanitiaan. Buat lewat{" "}
        <Link className="underline underline-offset-2" href="/leader/kepanitiaan">
          Manajemen Kepanitiaan
        </Link>
        .
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pilih Instance untuk Dibandingkan</CardTitle>
      </CardHeader>
      <CardContent>
        <form method="get" className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.kepanitiaanId} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">{group.kepanitiaanNama}</h3>
              <div className="flex flex-wrap gap-2">
                {group.instances.map((instance) => (
                  <label
                    key={instance.id}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="checkbox"
                      name="instance"
                      value={instance.id}
                      defaultChecked={selectedIds.includes(instance.id)}
                      className="size-4 shrink-0 accent-primary"
                    />
                    <span>{instance.siteNama}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <Button type="submit" className="w-fit">
            Tampilkan Perbandingan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
