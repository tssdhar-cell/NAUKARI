"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KanbanIcon, SearchIcon, TableIcon, XIcon } from "lucide-react";
import { JOB_STATUSES, PLATFORMS } from "@/lib/constants";
import { NativeSelect } from "@/components/native-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function JobFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = React.useState(params.get("q") ?? "");
  const view = params.get("view") === "kanban" ? "kanban" : "table";

  const update = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounce the search box.
  React.useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
  }, [q, params, update]);

  const hasFilters = params.get("q") || params.get("platform") || params.get("status");

  return (
    <div className="mb-4 grid gap-2 sm:flex sm:flex-wrap sm:items-center">
      <div className="relative sm:w-64">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company or title"
          className="bg-background pl-8"
          aria-label="Search jobs"
        />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:flex">
        <NativeSelect
          aria-label="Filter by platform"
          options={PLATFORMS}
          placeholder="All platforms"
          value={params.get("platform") ?? ""}
          onChange={(e) => update({ platform: e.target.value || null })}
          className="sm:w-40"
        />
        <NativeSelect
          aria-label="Filter by status"
          options={JOB_STATUSES}
          placeholder="All statuses"
          value={params.get("status") ?? ""}
          onChange={(e) => update({ status: e.target.value || null })}
          className="sm:w-36"
        />
        <NativeSelect
          aria-label="Sort"
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
          ]}
          value={params.get("sort") ?? "newest"}
          onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
          className="sm:w-36"
        />
      </div>
      {hasFilters && (
        <Button
          variant="ghost"
          onClick={() => {
            setQ("");
            update({ q: null, platform: null, status: null });
          }}
        >
          <XIcon /> Clear
        </Button>
      )}
      <div className="flex rounded-lg border bg-background p-0.5 sm:ml-auto">
        {(
          [
            { v: "table", label: "List", icon: TableIcon },
            { v: "kanban", label: "Board", icon: KanbanIcon },
          ] as const
        ).map(({ v, label, icon: Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => update({ view: v === "table" ? null : v })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors",
              view === v && "bg-accent font-medium text-accent-foreground",
            )}
            aria-pressed={view === v}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}
