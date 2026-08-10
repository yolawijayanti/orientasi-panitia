import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteCommitteeMember, updateCommitteeMember } from "@/lib/committee/actions";
import { NATIVE_SELECT_CLASSNAME } from "@/lib/utils";
import type { Bucket, CommitteeMember } from "@/components/committee/committee-members-section";

export function CommitteeMemberRow({
  member,
  buckets,
  currentPath,
}: {
  member: CommitteeMember;
  buckets: Bucket[];
  currentPath: string;
}) {
  const updateAction = updateCommitteeMember.bind(null, member.id, currentPath);
  const deleteAction = deleteCommitteeMember.bind(null, member.id, currentPath);

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border p-3">
      <form action={updateAction} className="flex flex-1 flex-wrap items-end gap-2">
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
            <Label htmlFor={`bucket-${member.id}`}>Bidang</Label>
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
      </form>
      <form action={deleteAction}>
        <Button type="submit" size="sm" variant="destructive">
          Hapus
        </Button>
      </form>
    </div>
  );
}
