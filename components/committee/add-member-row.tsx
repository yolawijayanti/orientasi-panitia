"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { NATIVE_SELECT_CLASSNAME } from "@/lib/utils";

export type CandidateAccount = { id: string; email: string };

/**
 * Trigger "+ Tambah Anggota" DI DALAM tiap kartu bidang, bukan satu form
 * global di bawah seluruh daftar. `bucketId` dikirim lewat hidden input
 * (bukan dropdown pilihan) -- bidang tujuan sudah pasti dari kartu mana
 * tombol ini diklik, jadi tidak ada langkah "pilih bidang yang benar" yang
 * bisa salah pencet atau diam-diam kepilih bidang lain.
 *
 * Email BUKAN lagi input teks bebas -- dipilih dari `candidateAccounts`
 * (akun panitia yang sudah terdaftar di public.users untuk instance ini,
 * lihat lib/committee/candidate-accounts.ts). Ini supaya committee_members
 * selalu sinkron dengan akun login sejak anggota pertama kali ditambah,
 * bukan menyusul diperbaiki kalau ketahuan ada typo email -- yang juga
 * jadi syarat "Tugas Saya" (pencocokan by email) bekerja tanpa drama.
 */
export function AddMemberRow({
  bucketId,
  candidateAccounts,
  addAction,
}: {
  bucketId: string;
  candidateAccounts: CandidateAccount[];
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

  if (candidateAccounts.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-md border p-3 text-sm text-muted-foreground">
        <p>
          Belum ada akun panitia terdaftar untuk instance ini, jadi belum ada yang bisa dipilih.
          Buat dulu akun login-nya lewat Supabase Dashboard &gt; Authentication (tautkan
          <code className="mx-1 rounded bg-muted px-1">kepanitiaan_site_id</code>
          ke instance ini di tabel <code className="rounded bg-muted px-1">public.users</code>),
          baru bisa ditambahkan ke sini.
        </p>
        <Button type="button" size="sm" variant="ghost" className="self-start" onClick={() => setIsAdding(false)}>
          Tutup
        </Button>
      </div>
    );
  }

  return (
    <form action={handleAdd} className="flex flex-wrap items-end gap-2 rounded-md border p-3">
      <input type="hidden" name="bucket_id" value={bucketId} />
      <div className="flex min-w-32 flex-1 flex-col gap-1">
        <Label htmlFor={`nama-baru-${bucketId}`}>Nama</Label>
        <Input id={`nama-baru-${bucketId}`} name="nama" required />
      </div>
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <Label htmlFor={`email-baru-${bucketId}`}>Akun (Email)</Label>
        <select
          id={`email-baru-${bucketId}`}
          name="email"
          defaultValue=""
          required
          className={NATIVE_SELECT_CLASSNAME}
        >
          <option value="" disabled>
            — Pilih akun terdaftar —
          </option>
          {candidateAccounts.map((account) => (
            <option key={account.id} value={account.email}>
              {account.email}
            </option>
          ))}
        </select>
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
