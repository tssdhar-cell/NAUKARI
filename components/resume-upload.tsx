"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";

export function ResumeUpload({ hasAny }: { hasAny: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = React.useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || !file.size) {
      toast.error("Choose a PDF first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/resumes", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
      toast.success("Resume uploaded");
      formRef.current?.reset();
      setFileName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-3 rounded-xl border bg-background p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label="PDF file" htmlFor="resume-file">
        <Input
          id="resume-file"
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name.replace(/\.pdf$/i, "") ?? "")}
        />
      </Field>
      <Field label="Version name" htmlFor="resume-name" hint="e.g. AI Engineer · Nov 2026">
        <Input id="resume-name" name="name" placeholder={fileName || "Resume"} maxLength={120} />
      </Field>
      <div className="grid gap-2">
        {hasAny && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="primary" className="size-4 accent-primary" /> Make primary
          </label>
        )}
        <Button type="submit" disabled={busy} className="h-10 md:h-9">
          {busy ? <Loader2Icon className="animate-spin" /> : <UploadIcon />} Upload
        </Button>
      </div>
    </form>
  );
}
