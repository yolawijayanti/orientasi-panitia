import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstanceGroup } from "@/lib/dashboard/leader-overview";

/**
 * Checklist multi-select semua instance, ditampilkan sebagai grid: baris =
 * event, kolom = site -- nama site yang sama selalu jatuh di kolom yang
 * sama di semua baris, jadi "berjajar" dan gampang dibandingkan sekilas
 * (mis. langsung kelihatan event mana yang belum jalan di site tertentu,
 * karena selnya kosong). Form GET tanpa `action` -- browser submit ke URL
 * halaman saat ini dengan checkbox terpilih sebagai query string
 * (`?instance=id1&instance=id2`), jadi nol client-side JS.
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

  const siteNames = Array.from(
    new Set(groups.flatMap((group) => group.instances.map((instance) => instance.siteNama)))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pilih event per site</CardTitle>
      </CardHeader>
      <CardContent>
        <form method="get" className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b p-2 text-left font-semibold">Event</th>
                  {siteNames.map((siteNama) => (
                    <th key={siteNama} className="border-b p-2 text-center font-semibold">
                      {siteNama}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const instanceBySite = new Map(
                    group.instances.map((instance) => [instance.siteNama, instance]),
                  );

                  return (
                    <tr key={group.kepanitiaanId} className="border-b">
                      <td className="p-2 font-medium">{group.kepanitiaanNama}</td>
                      {siteNames.map((siteNama) => {
                        const instance = instanceBySite.get(siteNama);
                        return (
                          <td key={siteNama} className="p-2 text-center">
                            {instance ? (
                              <input
                                type="checkbox"
                                name="instance"
                                value={instance.id}
                                defaultChecked={selectedIds.includes(instance.id)}
                                className="size-4 accent-primary"
                              />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Button type="submit" className="w-fit">
            Tampilkan Perbandingan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
