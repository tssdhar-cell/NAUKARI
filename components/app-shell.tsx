"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRingIcon,
  BriefcaseBusinessIcon,
  LayoutDashboardIcon,
  MenuIcon,
  MessageSquareTextIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusinessIcon },
  { href: "/contacts", label: "Recruiters", icon: UsersIcon },
  { href: "/follow-ups", label: "Follow-ups", icon: BellRingIcon },
  { href: "/templates", label: "Templates", icon: MessageSquareTextIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
        N
      </span>
      Naukari
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            isActive(pathname, href) && "bg-muted font-medium text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children, followUpsDue }: { children: React.ReactNode; followUpsDue: number }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex min-h-dvh w-full bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-background px-3 py-4 md:flex">
        <div className="px-2.5 pb-5">
          <Logo />
        </div>
        <Link href="/jobs/new" className={cn(buttonVariants({ size: "lg" }), "mb-4 w-full")}>
          <PlusIcon /> Add job
        </Link>
        <NavLinks />
        {followUpsDue > 0 && (
          <Link
            href="/follow-ups"
            className="mt-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          >
            <span className="font-semibold">{followUpsDue}</span> follow-up{followUpsDue === 1 ? "" : "s"} due today or
            overdue
          </Link>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-3 backdrop-blur md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 px-3 py-4">
              <SheetTitle className="px-2.5 pb-3">
                <Logo />
              </SheetTitle>
              <NavLinks onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Logo />
          <Link href="/jobs/new" aria-label="Add job" className={buttonVariants({ size: "icon" })}>
            <PlusIcon />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
