import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";
import { PageNav } from "@/components/page-nav";
import { KepanitiaanHeader } from "@/components/kepanitiaan/kepanitiaan-header";
import { deleteKepanitiaan, renameKepanitiaan } from "@/lib/kepanitiaan/actions";
import { uploadKepanitiaanLogo, removeKepanitiaanLogo } from "@/lib/kepanitiaan/logo-actions";
import { uploadBudgetTemplate, removeBudgetTemplate } from "@/lib/budget/template-actions";
import { loadBudgetTemplate, type BudgetTemplate } from "@/lib/budget/template";
import { createClient } from "@/lib/supabase/server";

const CURRENT_PATH = "/leader/kepanitiaan";

type InstanceRow = {
  id: string;
  kepanitiaan: { id: string; nama: string; logo_url: string | null } | null;
  site: { id: string; nama_site: string } | null;
};

export default async function KepanitiaanListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("kepanitiaan_site")
    .select("id, kepanitiaan(id, nama, logo_url), site:sites(id, nama_site)")
    .order("id");

  const instances = (data ?? []) as unknown as InstanceRow[];

  const grouped = new Map<string, { nama: string; logoUrl: string | null; instances: InstanceRow[] }>();
  for (const instance of instances) {
    if (!instance.kepanitiaan) continue;
    const key = instance.kepanitiaan.id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        nama: instance.kepanitiaan.nama,
        logoUrl: instance.kepanitiaan.logo_url,
        instances: [],
      });
    }
    grouped.get(key)!.instances.push(instance);
  }

  // Template budgeting per event (Fase 5 revisi) -- 1 storage list() call per
  // event, dijalankan paralel supaya tidak menambah waktu load berkali lipat
  // walau kepanitiaan-nya banyak.
  const groups = await Promise.all(
    Array.from(grouped.entries()).map(async ([id, group]) => ({
      id,
      ...group,
      budgetTemplate: await loadBudgetTemplate(supabase, id),
    })),
  );

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-2">
        <div>
          <PageNav homeHref="/leader/dashboard" />
          <h1 className="mt-1 text-xl font-semibold">Manajemen Kepanitiaan</h1>
          <p className="text-sm text-muted-foreground">
            Pilih salah satu site di bawah untuk membuka Timeline, Bucket Tugas, dan Susunan
            Panitia instance tersebut.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/leader/kepanitiaan/baru">+ Buat Kepanitiaan / Tambah Site</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {groups.length === 0 && (
        <p className="text-muted-foreground">
          Belum ada kepanitiaan. Buat yang pertama lewat tombol di atas.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {groups.map(({ id, nama, logoUrl, instances: groupInstances, budgetTemplate }) => {
          const renameAction = renameKepanitiaan.bind(null, id, CURRENT_PATH);
          const deleteAction = deleteKepanitiaan.bind(null, id, CURRENT_PATH);

          return (
            <Card key={id}>
              <CardHeader>
                <KepanitiaanHeader
                  nama={nama}
                  logoUrl={logoUrl}
                  jumlahInstance={groupInstances.length}
                  renameAction={renameAction}
                  deleteAction={deleteAction}
                  uploadLogoAction={uploadKepanitiaanLogo.bind(null, id, CURRENT_PATH)}
                  removeLogoAction={removeKepanitiaanLogo.bind(null, id, CURRENT_PATH)}
                  budgetTemplate={budgetTemplate as BudgetTemplate | null}
                  uploadBudgetTemplateAction={uploadBudgetTemplate.bind(null, id, CURRENT_PATH)}
                  removeBudgetTemplateAction={removeBudgetTemplate.bind(null, id, CURRENT_PATH)}
                />
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {groupInstances.map((instance) => (
                  <Button key={instance.id} asChild variant="outline" size="sm">
                    <Link href={`/leader/kepanitiaan/${instance.id}`}>
                      {instance.site?.nama_site ?? "Site tidak diketahui"}
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
