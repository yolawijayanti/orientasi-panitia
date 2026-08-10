import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CommitteeMemberRow } from "@/components/committee/committee-member-row";
import {
  addCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember,
} from "@/lib/committee/actions";
import { NATIVE_SELECT_CLASSNAME } from "@/lib/utils";

export type CommitteeMember = {
  id: string;
  nama: string;
  email: string | null;
  role: "anggota" | "leader_bidang";
  bucket_id: string | null;
};

export type Bucket = {
  id: string;
  nama_bidang: string;
};

/** Leader bidang selalu di atas; sisanya menjaga urutan input (query sudah order by created_at). */
function sortLeaderFirst(members: CommitteeMember[]): CommitteeMember[] {
  return [...members].sort((a, b) => {
    if (a.role === b.role) return 0;
    return a.role === "leader_bidang" ? -1 : 1;
  });
}

export function CommitteeMembersSection({
  kepanitiaanSiteId,
  members,
  buckets,
  currentPath,
  error,
}: {
  kepanitiaanSiteId: string;
  members: CommitteeMember[];
  buckets: Bucket[];
  currentPath: string;
  error?: string;
}) {
  const addAction = addCommitteeMember.bind(null, kepanitiaanSiteId, currentPath);

  const groups = buckets.map((bucket) => ({
    bucket,
    members: sortLeaderFirst(members.filter((member) => member.bucket_id === bucket.id)),
  }));

  // Anggota lama yang bucket_id-nya masih null (dibuat sebelum bidang jadi wajib
  // untuk semua role) tetap ditampilkan supaya tidak "hilang" dari halaman.
  const bucketIds = new Set(buckets.map((bucket) => bucket.id));
  const tanpaBidang = sortLeaderFirst(
    members.filter((member) => !member.bucket_id || !bucketIds.has(member.bucket_id)),
  );

  return (
    <div className="flex flex-col gap-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {members.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada anggota panitia.</p>
        )}

        {groups.map(({ bucket, members: anggotaBidang }) => (
          <div
            key={bucket.id}
            className="flex flex-col gap-2 overflow-hidden rounded-lg border-2 border-l-4 border-l-primary"
          >
            <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5">
              <h3 className="text-base font-semibold">{bucket.nama_bidang}</h3>
              <Badge variant="muted">{anggotaBidang.length} orang</Badge>
            </div>
            <div className="flex flex-col gap-2 px-4 pb-4">
              {anggotaBidang.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada anggota di bidang ini.</p>
              ) : (
                anggotaBidang.map((member) => (
                  <CommitteeMemberRow
                    key={member.id}
                    member={member}
                    buckets={buckets}
                    updateAction={updateCommitteeMember.bind(null, member.id, currentPath)}
                    deleteAction={deleteCommitteeMember.bind(null, member.id, currentPath)}
                  />
                ))
              )}
            </div>
          </div>
        ))}

        {tanpaBidang.length > 0 && (
          <div className="flex flex-col gap-2 overflow-hidden rounded-lg border-2 border-l-4 border-l-muted-foreground">
            <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5">
              <h3 className="text-base font-semibold">Tanpa Bidang</h3>
              <Badge variant="outline">{tanpaBidang.length} orang</Badge>
            </div>
            <div className="flex flex-col gap-2 px-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Anggota di bawah ini belum punya bidang. Pilih bidangnya lalu Simpan supaya masuk ke
              kelompok yang benar.
            </p>
            {tanpaBidang.map((member) => (
              <CommitteeMemberRow
                key={member.id}
                member={member}
                buckets={buckets}
                updateAction={updateCommitteeMember.bind(null, member.id, currentPath)}
                deleteAction={deleteCommitteeMember.bind(null, member.id, currentPath)}
              />
            ))}
            </div>
          </div>
        )}

        <form action={addAction} className="flex flex-wrap items-end gap-2 border-t pt-4">
          <div className="flex min-w-32 flex-1 flex-col gap-1">
            <Label htmlFor="nama-baru">Nama</Label>
            <Input id="nama-baru" name="nama" required />
          </div>
          <div className="flex min-w-40 flex-1 flex-col gap-1">
            <Label htmlFor="email-baru">Email</Label>
            <Input id="email-baru" name="email" type="email" />
          </div>
          <div className="flex min-w-32 flex-col gap-1">
            <Label htmlFor="role-baru">Role</Label>
            <select id="role-baru" name="role" defaultValue="anggota" className={NATIVE_SELECT_CLASSNAME}>
              <option value="anggota">Anggota</option>
              <option value="leader_bidang">Leader Bidang</option>
            </select>
          </div>
          {buckets.length > 0 && (
            <div className="flex min-w-40 flex-col gap-1">
              <Label htmlFor="bucket-baru">Bidang Tugas</Label>
              <select
                id="bucket-baru"
                name="bucket_id"
                defaultValue={buckets[0].id}
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
          <Button type="submit" size="sm">
            + Tambah Anggota
          </Button>
        </form>
    </div>
  );
}
