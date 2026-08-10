import { ChevronDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Section yang bisa dibuka/tutup pakai <details>/<summary> native -- tidak
 * butuh client-side JS maupun dependency Radix baru, dan state buka/tutupnya
 * selamat dari re-render server action (beda dengan useState, yang ikut
 * ter-reset kalau halamannya di-revalidate).
 *
 * `defaultOpen` menentukan section mana yang terbuka saat halaman dibuka
 * pertama kali.
 */
export function AccordionSection({
  title,
  defaultOpen = false,
  children,
  className,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <details open={defaultOpen} className="group">
        <summary className="flex cursor-pointer items-center justify-between gap-2 px-6 py-4 font-semibold">
          {title}
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t px-6 py-4">{children}</div>
      </details>
    </Card>
  );
}
