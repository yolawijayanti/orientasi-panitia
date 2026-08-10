"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Tombol submit dengan status pending. Tanpa ini, klik "Simpan" tidak
 * memberi umpan balik apapun -- server action jalan diam-diam lalu halaman
 * ter-revalidate, jadi terasa seperti tombolnya tidak bereaksi walaupun
 * fungsinya jalan.
 *
 * useFormStatus() harus dipanggil dari komponen ANAK <form>, bukan dari
 * komponen yang merender <form>-nya -- makanya ini komponen terpisah.
 */
export function SubmitButton({
  children,
  pendingLabel = "Menyimpan…",
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
