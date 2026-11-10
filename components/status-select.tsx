"use client";

import * as React from "react";
import { toast } from "sonner";
import { updateJobStatus } from "@/lib/actions/jobs";
import { JOB_STATUSES, labelOf, type JobStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Change a job's status in place. Parents pass key={status} so it resets after server updates. */
export function StatusSelect({ jobId, status, className }: { jobId: string; status: JobStatus; className?: string }) {
  const [value, setValue] = React.useState(status);
  const [pending, startTransition] = React.useTransition();


  function onChange(next: JobStatus) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const res = await updateJobStatus(jobId, next);
      if (res.error) {
        setValue(prev);
        toast.error(res.error);
      } else {
        toast.success(`Moved to ${labelOf(JOB_STATUSES, next)}`);
      }
    });
  }

  const tone = JOB_STATUSES.find((s) => s.value === value)?.tone;
  return (
    <select
      aria-label="Application status"
      value={value}
      disabled={pending}
      onChange={(e) => onChange(e.target.value as JobStatus)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "h-8 cursor-pointer rounded-full px-3 text-xs font-medium ring-1 ring-inset outline-none focus-visible:ring-2 disabled:opacity-60",
        tone,
        className,
      )}
    >
      {JOB_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
