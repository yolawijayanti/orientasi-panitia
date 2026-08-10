import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";
import { submitBudget } from "@/lib/budget/actions";
import type { BudgetSubmission } from "@/lib/budget/submission";
import type { BudgetTemplate } from "@/lib/budget/template";

/** Pola warna sama seperti STATUS_CHIP_CLASSNAME (lib/tasks/format.ts) --
 * "belum" pink seperti Assigned, "lengkap" hijau seperti Done. Tidak dipakai
 * StatusPill langsung karena tipenya terikat ke ItemStatus 3-status, bukan
 * belum/lengkap. */
const STATUS_LABEL: Record<BudgetSubmission["status"], string> = {
  belum: "Belum Lengkap",
  lengkap: "Lengkap",
};
const STATUS_CLASSNAME: Record<BudgetSubmission["status"], string> = {
  belum: "border-pink-300 bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",
  lengkap: "border-green-300 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};

/**
 * Widget khusus bucket "Budgeting" (is_budgeting=true) -- berdampingan
 * dengan Task Board di bucket yang sama (keputusan awal sesi Fase 5),
 * bukan menggantikannya, supaya tugas persiapan budget (misal "Siapkan
 * draft budget") masih bisa dicatat di bawah widget ini.
 *
 * Dipakai sama di halaman leader maupun panitia (pola BucketTasksSection),
 * jadi tidak ada gating role di sini -- RLS Storage/tabel budget_submissions
 * yang menjamin panitia hanya bisa upload ke instance-nya sendiri, leader
 * ke instance manapun.
 */
export function BudgetSubmissionSection({
  kepanitiaanSiteId,
  submission,
  template,
  currentPath,
}: {
  kepanitiaanSiteId: string;
  submission: BudgetSubmission;
  template: BudgetTemplate | null;
  currentPath: string;
}) {
  const submitAction = submitBudget.bind(null, kepanitiaanSiteId, currentPath);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budgeting</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Template Budgeting</span>
          {template ? (
            <Button asChild size="sm" className="w-fit">
              <a href={template.url} download>
                <Download className="size-4" />
                Budgeting Template
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Template belum diunggah leader. Hubungi leader untuk mengunggahnya lewat Dashboard
              Leader.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Submission Budget Instance Ini</span>
            <span
              className={cn(
                "inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
                STATUS_CLASSNAME[submission.status],
              )}
            >
              {STATUS_LABEL[submission.status]}
            </span>
          </div>

          {submission.fileUrl && (
            <Button asChild size="sm" variant="outline" className="w-fit">
              <a href={submission.fileUrl} target="_blank" rel="noreferrer">
                <FileText className="size-4" />
                Lihat File Terupload
              </a>
            </Button>
          )}

          <form action={submitAction} className="flex flex-wrap items-end gap-2">
            <div className="flex min-w-56 flex-1 flex-col gap-1">
              <Label htmlFor={`budget-file-${kepanitiaanSiteId}`}>
                {submission.status === "lengkap"
                  ? "Ganti File Submission (PDF/Excel/Word, maks 10 MB)"
                  : "Upload File Submission (PDF/Excel/Word, maks 10 MB)"}
              </Label>
              <Input
                id={`budget-file-${kepanitiaanSiteId}`}
                name="submission"
                type="file"
                accept=".pdf,.xls,.xlsx,.doc,.docx"
                required
                className="h-auto py-1.5 file:mr-2 file:rounded file:border file:px-2 file:py-0.5"
              />
            </div>
            <SubmitButton size="sm" pendingLabel="Mengunggah…">
              {submission.status === "lengkap" ? "Ganti File" : "Upload"}
            </SubmitButton>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
