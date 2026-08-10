import { FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { uploadBudgetTemplate, removeBudgetTemplate } from "@/lib/budget/template-actions";
import type { BudgetTemplate } from "@/lib/budget/template";

const CURRENT_PATH = "/leader/dashboard";

/**
 * Manajemen template budgeting MASTER -- satu file untuk semua instance
 * (bukan per kepanitiaan+site), jadi ditaruh di dashboard leader, bukan di
 * halaman per-instance. Leader-only lewat RLS Storage
 * (`budget_template_insert_leader` dkk, migration 20260810000009); tidak
 * ada gating role manual karena halaman ini sendiri sudah cuma dilihat
 * leader.
 *
 * Beda dari KepanitiaanHeader (Fase 4) yang lock-till-Edit: di sini form
 * upload selalu terlihat, karena halaman ini memang cuma berisi 1 card
 * pengaturan (tidak ada daftar panjang yang perlu dijaga rapi).
 */
export function BudgetTemplateSection({ template }: { template: BudgetTemplate | null }) {
  const uploadAction = uploadBudgetTemplate.bind(null, CURRENT_PATH);
  const removeAction = removeBudgetTemplate.bind(null, CURRENT_PATH);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Template Budgeting (Master)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Satu file ini didownload semua panitia lewat widget Budgeting di bucket masing-masing
          instance.
        </p>

        {template ? (
          <a
            href={template.url}
            download
            className="flex items-center gap-2 text-sm text-primary underline underline-offset-2"
          >
            <FileText className="size-4 shrink-0" />
            {template.name}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada template terunggah.</p>
        )}

        <form action={uploadAction} className="flex flex-wrap items-end gap-2 border-t pt-3">
          <div className="flex min-w-56 flex-1 flex-col gap-1">
            <Label htmlFor="budget-template-file">
              {template ? "Ganti Template" : "Upload Template"} (PDF/Excel/Word, maks 10 MB)
            </Label>
            <Input
              id="budget-template-file"
              name="template"
              type="file"
              accept=".pdf,.xls,.xlsx,.doc,.docx"
              required
              className="h-auto py-1.5 file:mr-2 file:rounded file:border file:px-2 file:py-0.5"
            />
          </div>
          <SubmitButton size="sm" pendingLabel="Mengunggah…">
            {template ? "Ganti" : "Upload"}
          </SubmitButton>
          {template && (
            <ConfirmSubmitButton
              size="sm"
              variant="outline"
              formAction={removeAction}
              confirmMessage="Hapus template budgeting? Panitia tidak akan bisa download template sampai diunggah lagi."
            >
              Hapus
            </ConfirmSubmitButton>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
