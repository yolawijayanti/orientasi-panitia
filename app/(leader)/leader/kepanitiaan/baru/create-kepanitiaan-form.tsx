"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createKepanitiaan, type CreateKepanitiaanState } from "@/lib/kepanitiaan/actions";

const initialState: CreateKepanitiaanState = {};

export function CreateKepanitiaanForm({
  sites,
}: {
  sites: { id: string; nama_site: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createKepanitiaan, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nama">Nama Kepanitiaan</Label>
        <Input id="nama" name="nama" placeholder="Contoh: FIND" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Site yang menjalankan</Label>
        {sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada site tersimpan. Tambahkan lewat kolom di bawah.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sites.map((site) => (
              <label key={site.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="site_names"
                  value={site.nama_site}
                  className="size-4 rounded border-input"
                />
                {site.nama_site}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new_site_names">Tambah site baru (pisahkan dengan koma, opsional)</Label>
        <Input
          id="new_site_names"
          name="new_site_names"
          placeholder="Contoh: Ciawi-Sentul, Cibitung, Jakarta-Area"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Membuat..." : "Buat Kepanitiaan"}
      </Button>
    </form>
  );
}
