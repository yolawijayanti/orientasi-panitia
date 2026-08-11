import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CommitteeMemberRow } from "@/components/committee/committee-member-row";
import { AddMemberRow } from "@/components/committee/add-member-row";
import {
  addCommitteeMember,
  bulkAddCommitteeMembers,
  updateCommitteeMember,
  deleteCommitteeMember,
} from "@/lib/committee/actions";
import type { CandidateAccount } from "@/lib/committee/candidate-accounts";

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
  candidateAccounts,
  currentPath,
  error,
  message,
}: {
  kepanitiaanSiteId: string;
  members: CommitteeMember[];
  buckets: Bucket[];
  candidateAccounts: CandidateAccount[];
  currentPath: string;
  error?: string;
  message?: string;
}) {
  const bulkAddAction = bulkAddCommitteeMembers.bind(null, kepanitiaanSiteId, currentPath);
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
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Tambah Banyak Sekaligus (Upload Excel/CSV)
        </summary>
        {/*
         * TANPA `encType="multipart/form-data"` -- kalau `action` adalah
         * Server Action (function), React sudah otomatis mengirim FormData
         * (termasuk File) apa adanya; menulis `encType` manual di sini malah
         * error di console ("React provides those automatically. They will
         * get overridden.") karena dianggap konflik dengan penanganan
         * otomatisnya.
         */}
        <form action={bulkAddAction} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex min-w-64 flex-1 flex-col gap-1">
            <Label htmlFor="file-bulk">File Excel/CSV</Label>
            <input
              id="file-bulk"
              name="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              required
              className="text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            <p className="text-xs text-muted-foreground">
              Kolom: Nama (wajib), Email (wajib, harus akun panitia yang sudah terdaftar), Role,
              Bidang (opsional).
            </p>
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Upload
          </Button>
        </form>
      </details>

      {members.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada anggota panitia.</p>
      )}

      {/*
       * Tombol "+ Tambah Anggota" DI DALAM tiap kartu bidang (AddMemberRow),
       * bukan satu form global di bawah semua kartu -- ini yang bikin bidang
       * kosong sebelumnya kelihatan tidak punya cara ditambahi (leader harus
       * scroll ke bawah lalu ingat-ingat pilih bidang yang benar dari
       * dropdown, yang gampang salah pencet atau lupa diubah dari default).
       * bucket_id sekarang dikirim lewat hidden input di AddMemberRow, jadi
       * tidak ada langkah pilih-bidang yang bisa salah sama sekali.
       */}
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
            <AddMemberRow
              bucketId={bucket.id}
              candidateAccounts={candidateAccounts}
              addAction={addCommitteeMember.bind(null, kepanitiaanSiteId, currentPath)}
            />
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
              Anggota di bawah ini belum punya bidang. Klik Edit, pilih bidangnya, lalu Simpan
              supaya masuk ke kelompok yang benar.
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
    </div>
  );
}
