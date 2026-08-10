"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { NATIVE_SELECT_CLASSNAME } from "@/lib/utils";

/**
 * Trigger "+ Tambah Anggota" DI DALAM tiap kartu bidang, bukan satu form
 * global di bawah seluruh daftar. `bucketId` dikirim lewat hidden input
 * (bukan dropdown pilihan) -- bidang tujuan sudah pasti dari kartu mana
 * tombol ini diklik, jadi tidak ada langkah "pilih bidang yang benar" yang
 * bisa salah pencet atau diam-diam kepilih bidang lain.
 *
 * Sebelum ini cuma ada SATU form tambah anggota di paling bawah section
 * (dengan dropdown bidang), jauh dari kartu bidang yang kosong -- dua
 * kejanggalan yang saling memperkuat: bidang kosong kelihatan tidak punya
 * cara ditambahi, dan menambah ke bidang ke-2/ke-3 gampang salah pilih
 * dropdown tanpa disadari (kembali ke bidang pertama karena defaultValue).
 */
export function AddMemberRow({
  bucketId,
  addAction,
}: {
  bucketId: string;
  addAction: (formData: FormData) => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd(formData: FormData) {
    await addAction(formData);
    setIsAdding(false);
  }

  if (!isAdding) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="size-3.5" />
        Tambah Anggota
      </Button>
    );
  }

  return (
    <form action={handleAdd} className="flex flex-wrap items-end gap-2 rounded-md border p-3">
      <input type="hidden" name="bucket_id" value={bucketId} />
      <div className="flex min-w-32 flex-1 flex-col gap-1">
        <Label htmlFor={`nama-baru-${bucketId}`}>Nama</Label>
        <Input id={`nama-baru-${bucketId}`} name="nama" required />
      </div>
      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <Label htmlFor={`email-baru-${bucketId}`}>Email</Label>
        <Input id={`email-baru-${bucketId}`} name="email" type="email" />
      </div>
      <div className="flex min-w-32 flex-col gap-1">
        <Label htmlFor={`role-baru-${bucketId}`}>Role</Label>
        <select
          id={`role-baru-${bucketId}`}
          name="role"
          defaultValue="anggota"
          className={NATIVE_SELECT_CLASSNAME}
        >
          <option value="anggota">Anggota</option>
          <option value="leader_bidang">Leader Bidang</option>
        </select>
      </div>
      <SubmitButton size="sm">Tambah</SubmitButton>
      <Button type="button" size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
        Batal
      </Button>
    </form>
  );
}
