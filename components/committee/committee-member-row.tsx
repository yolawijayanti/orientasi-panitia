"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { NATIVE_SELECT_CLASSNAME } from "@/lib/utils";
import type { Bucket, CommitteeMember } from "@/components/committee/committee-members-section";

/**
 * Baris anggota terkunci secara default -- tombol Simpan/Hapus baru muncul
 * setelah klik "Edit". Sebelumnya tiap baris selalu berupa form terbuka, yang
 * bikin halaman ramai dan gampang salah ubah tanpa sengaja.
 */
export function CommitteeMemberRow({
  member,
  buckets,
  updateAction,
  deleteAction,
}: {
  member: CommitteeMember;
  buckets: Bucket[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSave(formData: FormData) {
    await updateAction(formData);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form action={handleSave} className="flex flex-wrap items-end gap-2 rounded-md border p-3">
        <div className="flex min-w-32 flex-1 flex-col gap-1">
          <Label htmlFor={`nama-${member.id}`}>Nama</Label>
          <Input id={`nama-${member.id}`} name="nama" defaultValue={member.nama} required />
        </div>
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <Label htmlFor={`email-${member.id}`}>Email</Label>
          <Input
            id={`email-${member.id}`}
            name="email"
            type="email"
            defaultValue={member.email ?? ""}
          />
        </div>
        <div className="flex min-w-32 flex-col gap-1">
          <Label htmlFor={`role-${member.id}`}>Role</Label>
          <select
            id={`role-${member.id}`}
            name="role"
            defaultValue={member.role}
            className={NATIVE_SELECT_CLASSNAME}
          >
            <option value="anggota">Anggota</option>
            <option value="leader_bidang">Leader Bidang</option>
          </select>
        </div>
        {buckets.length > 0 && (
          <div className="flex min-w-40 flex-col gap-1">
            <Label htmlFor={`bucket-${member.id}`}>Bidang Tugas</Label>
            <select
              id={`bucket-${member.id}`}
              name="bucket_id"
              defaultValue={member.bucket_id ?? buckets[0].id}
              className={NATIVE_SELECT_CLASSNAME}
            >
              {buckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.nama_bidang}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button type="submit" size="sm" variant="secondary">
          Simpan
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
          Batal
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{member.nama}</span>
        {member.role === "leader_bidang" && <Badge>Leader Bidang</Badge>}
        {member.email && (
          <span className="text-sm text-muted-foreground">{member.email}</span>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <form action={deleteAction}>
          <ConfirmSubmitButton
            size="sm"
            variant="destructive"
            confirmMessage={`Hapus anggota "${member.nama}" dari susunan panitia?`}
          >
            Hapus
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
