import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { BudgetTemplateSection } from "@/components/budget/budget-template-section";
import { loadBudgetTemplate } from "@/lib/budget/template";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderDashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const template = await loadBudgetTemplate(supabase);

  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard Kepanitiaan (Leader)</h1>
          <p className="text-sm text-muted-foreground">Masuk sebagai {data.user?.email}</p>
        </div>
        <LogoutButton />
      </div>
      <Button asChild className="w-fit">
        <Link href="/leader/kepanitiaan">Kelola Kepanitiaan</Link>
      </Button>
      <p className="text-sm text-muted-foreground">
        Timeline, Bucket Tugas, dan Susunan Panitia dikelola <strong>per instance</strong>{" "}
        (kepanitiaan + site), bukan global — buka Kelola Kepanitiaan lalu pilih site-nya untuk
        masuk ke ketiganya.
      </p>
      <p className="text-muted-foreground">
        Ringkasan progres lintas kepanitiaan/site akan diimplementasikan di Fase 6.
      </p>

      <BudgetTemplateSection template={template} />
    </main>
  );
}
