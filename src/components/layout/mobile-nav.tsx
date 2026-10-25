"use client";

import { Menu } from "lucide-react";
import { Suspense, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PANEL_LABELS, type PanelArea } from "./nav-config";
import { PanelNav } from "./panel-nav";

export function MobileNav({ area }: { area: PanelArea }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(20rem,85vw)] gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle asChild>
            <div>
              <Logo href={area === "admin" ? "/admin" : `/${area}`} />
            </div>
          </SheetTitle>
          <SheetDescription>{PANEL_LABELS[area]} workspace</SheetDescription>
        </SheetHeader>
        <div className="p-3">
          <Suspense fallback={null}>
            <PanelNav area={area} onNavigate={() => setOpen(false)} />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}
