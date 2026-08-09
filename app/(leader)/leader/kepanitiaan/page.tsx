import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

type InstanceRow = {
  id: string;
  kepanitiaan: { id: string; nama: string } | null;
  site: { id: string; nama_site: string } | null;
};

export default async function KepanitiaanListPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kepanitiaan_site")
    .select("id, kepanitiaan(id, nama), site:sites(id, nama_site)")
    .order("id");

  const instances = (data ?? []) as unknown as InstanceRow[];

  const grouped = new Map<string, { nama: string; instances: InstanceRow[] }>();
  for (const instance of instances) {
    if (!instance.kepanitiaan) continue;
    const key = instance.kepanitiaan.id;
    if (!grouped.has(key)) {
      grouped.set(key, { nama: instance.kepanitiaan.nama, instances: [] });
    }
    grouped.get(key)!.instances.push(instance);
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Manajemen Kepanitiaan</h1>
          <p className="text-sm text-muted-foreground">
            Setiap kepanitiaan bisa berjalan di beberapa site sekaligus.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/leader/kepanitiaan/baru">+ Buat Kepanitiaan Baru</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {grouped.size === 0 && (
        <p className="text-muted-foreground">
          Belum ada kepanitiaan. Buat yang pertama lewat tombol di atas.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {Array.from(grouped.entries()).map(([id, group]) => (
          <Card key={id}>
            <CardHeader>
              <CardTitle>{group.nama}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {group.instances.map((instance) => (
                <Button key={instance.id} asChild variant="outline" size="sm">
                  <Link href={`/leader/kepanitiaan/${instance.id}`}>
                    {instance.site?.nama_site ?? "Site tidak diketahui"}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
