import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderDashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard Kepanitiaan (Leader)</h1>
          <p className="text-sm text-muted-foreground">Masuk sebagai {data.user?.email}</p>
        </div>
        <LogoutButton />
      </div>
      <p className="text-muted-foreground">
        Ringkasan progres lintas kepanitiaan/site akan diimplementasikan di Fase 6.
      </p>
    </main>
  );
}
