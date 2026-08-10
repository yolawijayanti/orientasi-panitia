import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function PanitiaDashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard Panitia</h1>
          <p className="text-sm text-muted-foreground">Masuk sebagai {data.user?.email}</p>
        </div>
        <LogoutButton />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="w-fit">
          <Link href="/panitia/susunan">Susunan Panitia</Link>
        </Button>
        <Button asChild className="w-fit" variant="outline">
          <Link href="/panitia/timeline">Timeline Pelaksanaan</Link>
        </Button>
        <Button asChild className="w-fit" variant="outline">
          <Link href="/panitia/bucket">Bucket Tugas</Link>
        </Button>
      </div>
    </main>
  );
}
