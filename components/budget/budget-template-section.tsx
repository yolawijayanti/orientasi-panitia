import { FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { cn } from "@/lib/utils";
import { uploadBudgetTemplate, removeBudgetTemplate } from "@/lib/budget/template-actions";
import type { BudgetTemplate } from "@/lib/budget/template";

const CURRENT_PATH = "/leader/kepanitiaan";

/**
 * Manajemen template budgeting MASTER -- satu file untuk semua instance
 * (bukan per kepanitiaan+site), jadi ditaruh di halaman utama Manajemen
 * Kepanitiaan (kanan atas), bukan di halaman per-instance -- leader minta
 * ini jadi akses cepat dari halaman yang paling sering dibuka, bukan
 * "nempel" di satu instance tertentu. Leader-only lewat RLS Storage
 * (`budget_template_insert_leader` dkk, migration 20260810000009); tidak
 * ada gating role manual karena halaman ini sendiri sudah cuma dilihat
 * leader.
 *
 * Layout form-nya vertikal (bukan flex-wrap sebaris seperti kebanyakan form
 * di codebase ini) karena widget ini sengaja ditaruh di kolom sempit kanan
 * atas -- form sebaris akan gampang terpotong/tumpang tindih di lebar
 * segitu.
 */
export function BudgetTemplateSection({
  template,
  className,
}: {
  template: BudgetTemplate | null;
  className?: string;
}) {
  const uploadAction = uploadBudgetTemplate.bind(null, CURRENT_PATH);
  const removeAction = removeBudgetTemplate.bind(null, CURRENT_PATH);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">Budgeting Template (Master)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Satu file ini didownload semua panitia lewat tab Submit Budget di instance masing-masing.
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

        <form action={uploadAction} className="flex flex-col gap-2 border-t pt-3">
          <Label htmlFor="budget-template-file" className="text-xs">
            {template ? "Ganti Template" : "Upload Template"} (PDF/Excel/Word, maks 10 MB)
          </Label>
          <Input
            id="budget-template-file"
            name="template"
            type="file"
            accept=".pdf,.xls,.xlsx,.doc,.docx"
            required
            className="h-auto py-1.5 text-xs file:mr-2 file:rounded file:border file:px-2 file:py-0.5"
          />
          <div className="flex gap-2">
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
