import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimelineBody } from "@/components/timeline/timeline-body";
import { addMilestone, deleteMilestone, updateMilestone } from "@/lib/timeline/actions";
import { todayJakartaISO } from "@/lib/timeline/format";

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
  const items = sorted.map((milestone) => ({
    milestone,
    updateAction: updateMilestone.bind(null, milestone.id, currentPath),
    deleteAction: deleteMilestone.bind(null, milestone.id, currentPath),
  }));

  return (
    <div className="flex flex-col gap-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <form action={addAction} className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/40 p-3">
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

      <TimelineBody items={items} todayIso={todayJakartaISO()} />
    </div>
  );
}
