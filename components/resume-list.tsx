"use client";

import * as React from "react";
import { DownloadIcon, EyeIcon, FileTextIcon, PencilIcon, StarIcon } from "lucide-react";
import { toast } from "sonner";
import { deleteResume, renameResume, setPrimaryResume } from "@/lib/actions/resumes";
import { formatBytes, formatDateTime } from "@/lib/dates";
import type { Resume } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/confirm-delete";
import { cn } from "@/lib/utils";
import { selectResume } from "@/components/collection-utils";

function subscribeDesktop(callback: () => void) {
  const query = window.matchMedia("(min-width: 1024px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function desktopSnapshot() { return window.matchMedia("(min-width: 1024px)").matches; }
function serverSnapshot() { return false; }

export function ResumeList({ resumes, timeZone }: { resumes: Resume[]; timeZone: string }) {
  const [previewId, setPreviewId] = React.useState<string | null>(resumes.find((r) => r.is_primary)?.id ?? resumes[0]?.id ?? null);
  const [pending, startTransition] = React.useTransition();
  const [previewRequested, setPreviewRequested] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(10);
  const isDesktop = React.useSyncExternalStore(subscribeDesktop, desktopSnapshot, serverSnapshot);
  const preview = selectResume(resumes, previewId);

  function run(fn: () => Promise<{ error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else toast.success(ok);
    });
  }

  function rename(r: Resume) {
    const name = window.prompt("Version name", r.name);
    if (name === null || name.trim() === r.name) return;
    run(() => renameResume(r.id, name), "Renamed");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <ul className="grid content-start gap-2">
        {resumes.slice(0, visibleCount).map((r) => (
          <li
            key={r.id}
            className={cn(
              "rounded-xl border bg-background p-3 transition-colors",
              preview?.id === r.id && "border-primary/40 ring-1 ring-primary/20",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileTextIcon className="size-4" />
              </div>
              <button type="button" onClick={() => { setPreviewId(r.id); setPreviewRequested(true); }} aria-label={`Select ${r.name} for preview`} className="min-w-0 flex-1 text-left">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {r.name}
                  {r.is_primary && (
                    <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary">
                      Primary
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(r.size_bytes)} · {formatDateTime(r.created_at, timeZone)}
                </p>
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <a
                href={`/api/resumes/${r.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <EyeIcon /> Open
              </a>
              <a href={`/api/resumes/${r.id}?download=1`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <DownloadIcon /> Download
              </a>
              {!r.is_primary && (
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => setPrimaryResume(r.id), "Set as primary")}>
                  <StarIcon /> Primary
                </Button>
              )}
              <Button variant="ghost" size="sm" disabled={pending} onClick={() => rename(r)}>
                <PencilIcon /> Rename
              </Button>
              <div className="ml-auto">
                <ConfirmDelete
                  iconOnly
                  label="Delete version"
                  title={`Delete “${r.name}”?`}
                  description="The PDF is removed from storage. This can't be undone."
                  onConfirm={deleteResume.bind(null, r.id)}
                  successMessage="Deleted"
                />
              </div>
            </div>
          </li>
        ))}
        {resumes.length > visibleCount && <li><Button variant="outline" onClick={() => setVisibleCount((count) => count + 10)}>Show more versions ({resumes.length - visibleCount} remaining)</Button></li>}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border bg-background lg:block">
        {preview && previewRequested && isDesktop ? (
          <>
          <div className="flex items-center justify-between gap-2 border-b p-3"><p className="truncate text-sm">{preview.name}</p><Button variant="ghost" size="sm" onClick={() => setPreviewRequested(false)}>Close preview</Button></div>
          <iframe
            key={preview.id}
            src={`/api/resumes/${preview.id}#toolbar=0&view=FitH`}
            title={`Preview of ${preview.name}`}
            className="h-[80vh] w-full"
          />
          </>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <p>Preview a version here, or use Open to view it in a new tab.</p>
            {preview && <Button className="mt-3" variant="outline" onClick={() => setPreviewRequested(true)}><EyeIcon /> Preview {preview.name}</Button>}
          </div>
        )}
      </div>
    </div>
  );
}
