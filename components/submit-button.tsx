"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Tombol submit dengan status pending.
 *
 * Ada DUA sumber status pending, dan keduanya di-OR:
 *  - `useFormStatus()` -- jalan kalau <form action={serverAction}> langsung.
 *  - prop `pending` -- dipakai kalau form-nya pakai handler client
 *    (`action={handleSave}` yang di dalamnya `await serverAction(...)`).
 *
 * Kenapa perlu keduanya: useFormStatus melaporkan pending untuk submit form
 * itu sendiri, tapi begitu handler client mengambil alih (await server action
 * lalu setState), jendela pending-nya bisa terlalu pendek/tidak terlihat.
 * Prop `pending` eksplisit dari state pemanggil membuat umpan baliknya pasti
 * muncul, tidak bergantung pada timing.
 */
export function SubmitButton({
  children,
  pendingLabel = "Menyimpan…",
  pending: pendingProp = false,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string; pending?: boolean }) {
  const { pending: formPending } = useFormStatus();
  const pending = formPending || pendingProp;

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
