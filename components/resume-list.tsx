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

export function ResumeList({ resumes, timeZone }: { resumes: Resume[]; timeZone: string }) {
  const [previewId, setPreviewId] = React.useState<string | null>(resumes.find((r) => r.is_primary)?.id ?? resumes[0]?.id ?? null);
  const [pending, startTransition] = React.useTransition();
  const preview = resumes.find((r) => r.id === previewId) ?? null;

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
        {resumes.map((r) => (
          <li
            key={r.id}
            className={cn(
              "rounded-xl border bg-background p-3 transition-colors",
              previewId === r.id && "border-primary/40 ring-1 ring-primary/20",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileTextIcon className="size-4" />
              </div>
              <button type="button" onClick={() => setPreviewId(r.id)} className="min-w-0 flex-1 text-left">
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
      </ul>

      <div className="hidden overflow-hidden rounded-xl border bg-background lg:block">
        {preview ? (
          <iframe
            key={preview.id}
            src={`/api/resumes/${preview.id}#toolbar=0&view=FitH`}
            title={`Preview of ${preview.name}`}
            className="h-[80vh] w-full"
          />
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">Select a version to preview it.</p>
        )}
      </div>
    </div>
  );
}
