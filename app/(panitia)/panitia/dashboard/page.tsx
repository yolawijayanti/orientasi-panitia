import Link from "next/link";
import { CalendarDays, ClipboardList, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";
import { ProgressRing } from "@/components/buckets/progress-ring";
import { loadBucketBoardData } from "@/lib/buckets/board-data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export default async function PanitiaDashboardPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const kepanitiaanSiteId = currentUser?.kepanitiaanSiteId;

  if (!kepanitiaanSiteId) {
    return (
      <main className="flex min-h-screen flex-col gap-4 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Selamat datang di PanitiYAY</h1>
          <LogoutButton />
        </div>
        <p className="text-muted-foreground">
          Akun ini belum terhubung ke instance kepanitiaan manapun. Hubungi leader.
        </p>
      </main>
    );
  }

  const { data: instance } = await supabase
    .from("kepanitiaan_site")
    .select("kepanitiaan(nama), site:sites(nama_site)")
    .eq("id", kepanitiaanSiteId)
    .single();

  const typedInstance = instance as unknown as {
    kepanitiaan: { nama: string } | null;
    site: { nama_site: string } | null;
  } | null;

  const { data: buckets } = await supabase
    .from("buckets")
    .select("id, nama_bidang, is_budgeting")
    .eq("kepanitiaan_site_id", kepanitiaanSiteId)
    .order("created_at");

  const bucketRows = (buckets ?? []) as {
    id: string;
    nama_bidang: string;
    is_budgeting: boolean;
  }[];

  const board = await loadBucketBoardData(supabase, kepanitiaanSiteId, bucketRows);

  const { count: jumlahAnggota } = await supabase
    .from("committee_members")
    .select("id", { count: "exact", head: true })
    .eq("kepanitiaan_site_id", kepanitiaanSiteId);

  const { count: jumlahMilestone } = await supabase
    .from("timeline_milestones")
    .select("id", { count: "exact", head: true })
    .eq("kepanitiaan_site_id", kepanitiaanSiteId);

  const namaInstance = `${typedInstance?.kepanitiaan?.nama} @ ${typedInstance?.site?.nama_site}`;

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Selamat datang di PanitiYAY!</h1>
          <p className="text-sm text-muted-foreground">
            Masuk sebagai {currentUser?.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{namaInstance}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-1">
            <ProgressRing percent={board.masterProgress.percent} size={116} />
            <span className="text-xs text-muted-foreground">Progres kepanitiaan</span>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-md border p-3">
                <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold tabular-nums">
                    {board.masterProgress.done}/{board.masterProgress.total}
                  </span>
                  <span className="text-xs text-muted-foreground">Tugas selesai</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md border p-3">
                <Users className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold tabular-nums">{jumlahAnggota ?? 0}</span>
                  <span className="text-xs text-muted-foreground">Anggota panitia</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md border p-3">
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold tabular-nums">{jumlahMilestone ?? 0}</span>
                  <span className="text-xs text-muted-foreground">Milestone</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Task Board, Timeline, dan Susunan Panitia ada dalam satu halaman kerja — pilih
              tab-nya di sana.
            </p>

            <Button asChild className="w-fit">
              <Link href="/panitia/workspace">Buka Workspace →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
