import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { PageHeader } from "@/components/page-header";
import { LeaderNotificationBell } from "@/components/notifications/leader-notification-bell";
import { InstancePicker } from "@/components/dashboard/instance-picker";
import { InstanceOverviewCard } from "@/components/dashboard/instance-overview-card";
import { loadInstanceGroups, loadInstanceOverview } from "@/lib/dashboard/leader-overview";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ instance?: string | string[] }>;
}) {
  const { instance } = await searchParams;
  const selectedIds = instance === undefined ? [] : Array.isArray(instance) ? instance : [instance];

  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const groups = await loadInstanceGroups(supabase);

  const allInstances = groups.flatMap((group) => group.instances);
  const selectedInstances = allInstances.filter((opt) => selectedIds.includes(opt.id));
  const overviews = await Promise.all(
    selectedInstances.map((opt) => loadInstanceOverview(supabase, opt)),
  );

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <PageHeader
        title="Dashboard Kepanitiaan (Leader)"
        description={
          <p className="text-sm text-muted-foreground">Masuk sebagai {currentUser?.email}</p>
        }
        bell={<LeaderNotificationBell />}
        actions={<LogoutButton />}
      />

      <Button asChild className="w-fit">
        <Link href="/leader/kepanitiaan">Kelola Kepanitiaan</Link>
      </Button>
      <p className="text-sm text-muted-foreground">
        Selamat datang, Leader! Klik <strong>Kelola Kepanitiaan</strong> untuk melihat detil per
        event atau pilih event per site yang hendak kamu pantau di bawah ini.
      </p>

      <InstancePicker groups={groups} selectedIds={selectedIds} />

      {overviews.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            Perbandingan Progres ({overviews.length} instance)
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {overviews.map((overview) => (
              <InstanceOverviewCard key={overview.id} overview={overview} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
