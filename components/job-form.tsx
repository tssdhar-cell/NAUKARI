"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveJob } from "@/lib/actions/jobs";
import { JOB_STATUSES, PLATFORMS } from "@/lib/constants";
import type { JobWithFollowUp } from "@/lib/types";
import { Field, FormError } from "@/components/field";
import { NativeSelect } from "@/components/native-select";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";

function guessPlatform(url: string) {
  const u = url.toLowerCase();
  if (u.includes("linkedin.")) return "linkedin";
  if (u.includes("glassdoor.")) return "glassdoor";
  if (u.includes("instahyre.")) return "instahyre";
  return null;
}

export function JobForm({ job, today }: { job?: JobWithFollowUp; today: string }) {
  const [state, action] = useActionState(saveJob, {});
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-6" noValidate>
      {job && <input type="hidden" name="id" value={job.id} />}
      <FormError message={state.error} />

      <div className="grid gap-4 rounded-xl border bg-background p-4 sm:p-5">
        <Field label="Job link" htmlFor="url" error={err.url} hint="Paste the LinkedIn / Glassdoor / careers page URL">
          <Input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            placeholder="https://www.linkedin.com/jobs/view/…"
            defaultValue={job?.url ?? ""}
            aria-invalid={!!err.url}
            onChange={(e) => {
              const p = guessPlatform(e.target.value);
              const select = e.currentTarget.form?.elements.namedItem("platform") as HTMLSelectElement | null;
              if (p && select && !job) select.value = p;
            }}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title" htmlFor="title" error={err.title} required>
            <Input id="title" name="title" defaultValue={job?.title} aria-invalid={!!err.title} required />
          </Field>
          <Field label="Company" htmlFor="company" error={err.company} required>
            <Input id="company" name="company" defaultValue={job?.company} aria-invalid={!!err.company} required />
          </Field>
          <Field label="Platform" htmlFor="platform" error={err.platform}>
            <NativeSelect id="platform" name="platform" options={PLATFORMS} defaultValue={job?.platform ?? "linkedin"} />
          </Field>
          <Field label="Location" htmlFor="location" error={err.location}>
            <Input id="location" name="location" placeholder="Bengaluru · Remote" defaultValue={job?.location ?? ""} />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border bg-background p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="status" error={err.status}>
            <NativeSelect id="status" name="status" options={JOB_STATUSES} defaultValue={job?.status ?? "saved"} />
          </Field>
          <Field label="Follow-up date" htmlFor="follow_up_date" error={err.follow_up_date} hint="Shows up in Follow-ups">
            <Input id="follow_up_date" name="follow_up_date" type="date" defaultValue={job?.next_follow_up ?? ""} />
          </Field>
          <Field label="Date added" htmlFor="date_added" error={err.date_added}>
            <Input id="date_added" name="date_added" type="date" defaultValue={job?.date_added ?? today} required />
          </Field>
          <Field label="Date applied" htmlFor="date_applied" error={err.date_applied}>
            <Input id="date_applied" name="date_applied" type="date" defaultValue={job?.date_applied ?? ""} />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border bg-background p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Experience required" htmlFor="experience" error={err.experience}>
            <Input id="experience" name="experience" placeholder="3–5 years" defaultValue={job?.experience ?? ""} />
          </Field>
          <Field label="Salary range" htmlFor="salary_range" error={err.salary_range}>
            <Input id="salary_range" name="salary_range" placeholder="₹20–28 LPA" defaultValue={job?.salary_range ?? ""} />
          </Field>
        </div>
        <Field label="Personal notes" htmlFor="notes" error={err.notes}>
          <Textarea id="notes" name="notes" rows={4} defaultValue={job?.notes ?? ""} placeholder="Why this role, referral, prep…" />
        </Field>
        <Field label="Job description" htmlFor="description" error={err.description} hint="Optional — paste the key parts">
          <Textarea id="description" name="description" rows={6} defaultValue={job?.description ?? ""} />
        </Field>
      </div>

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
        <Link
          href={job ? `/jobs/${job.id}` : "/jobs"}
          className={buttonVariants({ variant: "outline", size: "lg", className: "flex-1 sm:flex-none" })}
        >
          Cancel
        </Link>
        <SubmitButton size="lg" className="flex-1 sm:flex-none" pendingText="Saving…">
          {job ? "Save changes" : "Add job"}
        </SubmitButton>
      </div>
    </form>
  );
}
