import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addMilestone, deleteMilestone, updateMilestone } from "@/lib/timeline/actions";

export type Milestone = {
  id: string;
  nama_milestone: string;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
};

export function TimelineSection({
  kepanitiaanSiteId,
  milestones,
  currentPath,
  error,
}: {
  kepanitiaanSiteId: string;
  milestones: Milestone[];
  currentPath: string;
  error?: string;
}) {
  const sorted = [...milestones].sort((a, b) => a.tanggal_mulai.localeCompare(b.tanggal_mulai));
  const addAction = addMilestone.bind(null, kepanitiaanSiteId, currentPath);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline Pelaksanaan</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col">
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada milestone.</p>
          )}
          {sorted.map((milestone, index) => {
            const updateAction = updateMilestone.bind(null, milestone.id, currentPath);
            const deleteAction = deleteMilestone.bind(null, milestone.id, currentPath);
            const isLast = index === sorted.length - 1;

            return (
              <div key={milestone.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="mt-4 size-3 shrink-0 rounded-full bg-primary" />
                  {!isLast && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className="flex flex-1 flex-wrap items-end gap-2 rounded-md border p-3 mb-4">
                  <form action={updateAction} className="flex flex-1 flex-wrap items-end gap-2">
                    <div className="flex min-w-40 flex-1 flex-col gap-1">
                      <Label htmlFor={`nama-${milestone.id}`}>Nama Milestone</Label>
                      <Input
                        id={`nama-${milestone.id}`}
                        name="nama_milestone"
                        defaultValue={milestone.nama_milestone}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`mulai-${milestone.id}`}>Tanggal Mulai</Label>
                      <Input
                        id={`mulai-${milestone.id}`}
                        name="tanggal_mulai"
                        type="date"
                        defaultValue={milestone.tanggal_mulai}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`selesai-${milestone.id}`}>Tanggal Selesai</Label>
                      <Input
                        id={`selesai-${milestone.id}`}
                        name="tanggal_selesai"
                        type="date"
                        defaultValue={milestone.tanggal_selesai ?? ""}
                      />
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
              </div>
            );
          })}
        </div>

        <form action={addAction} className="flex flex-wrap items-end gap-2 border-t pt-4">
          <div className="flex min-w-40 flex-1 flex-col gap-1">
            <Label htmlFor="nama-milestone-baru">Nama Milestone</Label>
            <Input id="nama-milestone-baru" name="nama_milestone" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="mulai-baru">Tanggal Mulai</Label>
            <Input id="mulai-baru" name="tanggal_mulai" type="date" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="selesai-baru">Tanggal Selesai</Label>
            <Input id="selesai-baru" name="tanggal_selesai" type="date" />
          </div>
          <Button type="submit" size="sm">
            + Tambah Milestone
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
