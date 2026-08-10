import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OrphanCommitteeMember } from "@/lib/committee/orphan-check";

/**
 * Read-only -- lihat komentar di lib/committee/orphan-check.ts kenapa tidak
 * ada tombol hapus di sini. Leader yang menentukan mana yang benar-benar
 * usang, lalu hapus lewat tombol "Hapus" yang sudah ada di Susunan Panitia
 * instance terkait (link "Buka Instance" di sini langsung ke situ).
 */
export function OrphanCheckSection({ orphans }: { orphans: OrphanCommitteeMember[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cek Susunan Panitia (Read-only)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Entri Susunan Panitia yang emailnya tidak cocok akun panitia aktif di instance itu --
          biasanya sisa dari akun yang sudah dipindah ke instance lain. Bukan otomatis dihapus --
          cek dulu, baru hapus manual lewat Susunan Panitia instance terkait kalau memang sudah
          tidak relevan.
        </p>

        {orphans.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 shrink-0 text-green-600" />
            Tidak ada entri yang perlu dicek.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {orphans.map((orphan) => (
              <li
                key={orphan.memberId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {orphan.nama} <span className="text-muted-foreground">({orphan.email})</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Tercatat di {orphan.kepanitiaanNama} @ {orphan.namaSite}
                    </span>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/leader/kepanitiaan/${orphan.instanceId}`}>Buka Instance</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
