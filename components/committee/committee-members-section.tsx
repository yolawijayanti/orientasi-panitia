import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addCommitteeMember,
  deleteCommitteeMember,
  updateCommitteeMember,
} from "@/lib/committee/actions";

const SELECT_CLASSNAME =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export type CommitteeMember = {
  id: string;
  nama: string;
  email: string | null;
  role: "anggota" | "leader_bidang";
};

export function CommitteeMembersSection({
  kepanitiaanSiteId,
  members,
  currentPath,
  error,
}: {
  kepanitiaanSiteId: string;
  members: CommitteeMember[];
  currentPath: string;
  error?: string;
}) {
  const addAction = addCommitteeMember.bind(null, kepanitiaanSiteId, currentPath);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Susunan Panitia</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-3">
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada anggota panitia.</p>
          )}
          {members.map((member) => {
            const updateAction = updateCommitteeMember.bind(null, member.id, currentPath);
            const deleteAction = deleteCommitteeMember.bind(null, member.id, currentPath);

            return (
              <div
                key={member.id}
                className="flex flex-wrap items-end gap-2 rounded-md border p-3"
              >
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
                      className={SELECT_CLASSNAME}
                    >
                      <option value="anggota">Anggota</option>
                      <option value="leader_bidang">Leader Bidang</option>
                    </select>
                  </div>
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
          })}
        </div>

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
            <select id="role-baru" name="role" defaultValue="anggota" className={SELECT_CLASSNAME}>
              <option value="anggota">Anggota</option>
              <option value="leader_bidang">Leader Bidang</option>
            </select>
          </div>
          <Button type="submit" size="sm">
            + Tambah Anggota
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
