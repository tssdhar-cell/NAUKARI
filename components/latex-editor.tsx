"use client";

import * as React from "react";
import { useActionState } from "react";
import { DownloadIcon, ExternalLinkIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { deleteResumeSource, saveResumeSource } from "@/lib/actions/resumes";
import type { FormState, ResumeSource } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

const STARTER = `\\documentclass[11pt]{article}
\\usepackage[margin=0.8in]{geometry}
\\usepackage{enumitem}
\\pagestyle{empty}

\\begin{document}
\\begin{center}
  {\\LARGE \\textbf{Your Name}}\\\\[2pt]
  City, India \\quad | \\quad you@email.com \\quad | \\quad linkedin.com/in/you
\\end{center}

\\section*{Experience}
\\textbf{Role} --- Company \\hfill 2024 -- Present
\\begin{itemize}[leftmargin=*, nosep]
  \\item What you did and the impact.
\\end{itemize}

\\section*{Skills}
Python, LLMs, RAG, \\ldots

\\end{document}
`;

function SourceEditor({ source, isNew, onDone }: { source?: ResumeSource; isNew?: boolean; onDone?: () => void }) {
  const [content, setContent] = React.useState(source?.content ?? (isNew ? STARTER : ""));
  const [name, setName] = React.useState(source?.name ?? "resume.tex");
  const dirty = content !== (source?.content ?? "") || name !== (source?.name ?? "");

  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await saveResumeSource(prev, fd);
    if (res.ok) {
      toast.success("Saved");
      onDone?.();
    }
    return res;
  }, {});

  function download() {
    const blob = new Blob([content], { type: "application/x-tex" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name.endsWith(".tex") ? name : `${name}.tex`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <form action={action} className="grid gap-3">
      {source && <input type="hidden" name="id" value={source.id} />}
      <FormError message={state.error} />
      <div className="flex flex-wrap items-end gap-2">
        <Field label="File name" htmlFor={`src-name-${source?.id ?? "new"}`} className="w-56">
          <Input id={`src-name-${source?.id ?? "new"}`} name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <CopyButton text={content} label="Copy" size="sm" />
          <Button type="button" variant="outline" size="sm" onClick={download} disabled={!content}>
            <DownloadIcon /> .tex
          </Button>
          <OpenInOverleaf content={content} />
        </div>
      </div>
      <textarea
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
        rows={24}
        className={cn(
          "w-full resize-y rounded-lg border border-input bg-background p-3 font-mono text-[13px] leading-relaxed outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {dirty ? "Unsaved changes" : "Saved"} · {content.length.toLocaleString()} characters
        </p>
        <div className="flex gap-2">
          {source && (
            <ConfirmDelete
              iconOnly
              label="Delete source"
              title={`Delete ${source.name}?`}
              description="The LaTeX source is removed. Uploaded PDFs are not affected."
              onConfirm={deleteResumeSource.bind(null, source.id)}
              successMessage="Deleted"
            />
          )}
          {isNew && onDone && (
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
          )}
          <SubmitButton pendingText="Saving…" disabled={!dirty && !isNew}>
            Save
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

/** Posts the source to Overleaf from the browser (opens in a new tab; needs an Overleaf login). */
function OpenInOverleaf({ content }: { content: string }) {
  return (
    <form action="https://www.overleaf.com/docs" method="post" target="_blank" className="contents">
      <input type="hidden" name="snip" value={content} />
      <input type="hidden" name="snip_name" value="resume" />
      <input type="hidden" name="engine" value="pdflatex" />
      <Button type="submit" variant="outline" size="sm" disabled={!content}>
        <ExternalLinkIcon /> Open in Overleaf
      </Button>
    </form>
  );
}

export function LatexEditor({ sources }: { sources: ResumeSource[] }) {
  const [activeId, setActiveId] = React.useState<string | "new" | null>(sources[0]?.id ?? null);
  const active = sources.find((s) => s.id === activeId);

  if (sources.length === 0 && activeId !== "new") {
    return (
      <div className="rounded-xl border border-dashed bg-background/60 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Keep your resume&apos;s LaTeX source here. Edit, then compile in Overleaf and upload the PDF above.</p>
        <Button className="mt-3" onClick={() => setActiveId("new")}>
          <PlusIcon /> Add LaTeX source
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {sources.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(s.id)}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm",
              activeId === s.id ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {s.name}
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setActiveId("new")} className={cn(activeId === "new" && "bg-accent")}>
          <PlusIcon /> New
        </Button>
      </div>
      {activeId === "new" ? (
        <SourceEditor key="new" isNew onDone={() => setActiveId(sources[0]?.id ?? null)} />
      ) : active ? (
        <SourceEditor key={active.id + active.updated_at} source={active} />
      ) : null}
    </div>
  );
}
