"use client";

import { useState, type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SideTab = {
  id: string;
  label: string;
  content: ReactNode;
};

/**
 * Navigasi antar-section menyamping (tab), menggantikan accordion yang
 * membuka ke bawah. Konten tiap tab dirender di server lalu dioper sebagai
 * prop `content` -- jadi komponen ini boleh "use client" tanpa memaksa
 * section di dalamnya ikut jadi client component.
 *
 * Semua tab dirender sekaligus dan yang tidak aktif disembunyikan lewat
 * `hidden`, BUKAN di-unmount. Ini disengaja: kalau di-unmount, form yang
 * sedang diisi di tab lain ikut hilang isinya begitu tab berganti.
 */
export function SideTabs({ tabs }: { tabs: SideTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap gap-1 border-b p-2" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" hidden={tab.id !== activeId} className="px-6 py-5">
          {tab.content}
        </div>
      ))}
    </Card>
  );
}
