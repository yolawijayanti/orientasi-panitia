import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { CreateKepanitiaanForm } from "./create-kepanitiaan-form";

export default async function BuatKepanitiaanPage() {
  const supabase = await createClient();
  const { data: sites } = await supabase.from("sites").select("id, nama_site").order("nama_site");

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-8">
      <div className="w-full max-w-md">
        <Link href="/leader/kepanitiaan" className="text-sm text-muted-foreground hover:underline">
          ← Kembali ke daftar kepanitiaan
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Buat Kepanitiaan Baru</CardTitle>
          <CardDescription>
            Pilih site yang menjalankan — instance dan 6 bucket default akan otomatis dibuat
            untuk setiap site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateKepanitiaanForm sites={sites ?? []} />
        </CardContent>
      </Card>
    </main>
  );
}
