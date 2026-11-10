"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { BellIcon, CalendarClockIcon, SendIcon, StickyNoteIcon } from "lucide-react";
import { addActivity } from "@/lib/actions/activities";
import { METHODS } from "@/lib/constants";
import type { FormState } from "@/lib/types";
import { Field, FormError } from "@/components/field";
import { NativeSelect } from "@/components/native-select";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Kind = "note" | "follow_up" | "interview" | "outreach";
type Option = { value: string; label: string };

const KINDS: { value: Kind; label: string; icon: typeof StickyNoteIcon }[] = [
  { value: "note", label: "Note", icon: StickyNoteIcon },
  { value: "follow_up", label: "Follow-up", icon: BellIcon },
  { value: "interview", label: "Interview", icon: CalendarClockIcon },
  { value: "outreach", label: "Outreach", icon: SendIcon },
];

/**
 * Add a note / follow-up / interview / outreach entry.
 * Pass `jobId` (job page) or `contactId` (recruiter page); the other side is optional and picked from a list.
 */
export function ActivityForm({
  jobId,
  contactId,
  contactOptions = [],
  jobOptions = [],
}: {
  jobId?: string;
  contactId?: string;
  contactOptions?: Option[];
  jobOptions?: Option[];
}) {
  const [kind, setKind] = React.useState<Kind>("note");
  const formRef = React.useRef<HTMLFormElement>(null);

  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await addActivity(prev, fd);
    if (res.ok) {
      formRef.current?.reset();
      toast.success("Saved");
    }
    return res;
  }, {});
  const err = state.fieldErrors ?? {};

  return (
    <form ref={formRef} action={action} className="grid gap-3 rounded-xl border bg-background p-3 sm:p-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-0.5" role="tablist">
        {KINDS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={kind === value}
            onClick={() => setKind(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground",
              kind === value && "bg-background font-medium text-primary shadow-xs",
            )}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      <input type="hidden" name="type" value={kind} />
      {jobId && <input type="hidden" name="job_id" value={jobId} />}
      {contactId && <input type="hidden" name="contact_id" value={contactId} />}
      <FormError message={state.error && !state.fieldErrors ? state.error : undefined} />

      {(kind === "follow_up" || kind === "interview") && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Field label={kind === "interview" ? "Interview round" : "What to follow up on"} htmlFor="act-title" error={err.title}>
            <Input
              id="act-title"
              name="title"
              placeholder={kind === "interview" ? "Round 1 — Technical" : "Ping recruiter about status"}
            />
          </Field>
          <Field label="Date" htmlFor="act-date" error={err.due_date}>
            <Input id="act-date" name="due_date" type="date" required />
          </Field>
          {kind === "interview" && (
            <Field label="Time" htmlFor="act-time" error={err.due_time}>
              <Input id="act-time" name="due_time" type="time" />
            </Field>
          )}
        </div>
      )}

      {kind === "outreach" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {!contactId && (
            <Field label="Recruiter" htmlFor="act-contact" error={err.contact_id}>
              <NativeSelect id="act-contact" name="contact_id" options={contactOptions} placeholder="— None —" />
            </Field>
          )}
          {!jobId && (
            <Field label="Job" htmlFor="act-job" error={err.job_id}>
              <NativeSelect id="act-job" name="job_id" options={jobOptions} placeholder="— None —" />
            </Field>
          )}
          <Field label="Method" htmlFor="act-method">
            <NativeSelect id="act-method" name="method" options={METHODS} defaultValue="linkedin" />
          </Field>
          <Field label="Next follow-up" htmlFor="act-next" error={err.next_follow_up}>
            <Input id="act-next" name="next_follow_up" type="date" />
          </Field>
        </div>
      )}

      {kind !== "follow_up" && (
        <Field
          label={kind === "outreach" ? "Message sent" : kind === "interview" ? "Prep notes" : "Note"}
          htmlFor="act-body"
          error={err.body}
        >
          <Textarea id="act-body" name="body" rows={kind === "note" ? 4 : 3} placeholder={kind === "note" ? "Write a note…" : ""} />
        </Field>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {kind === "outreach" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="response_received" className="size-4 rounded border-input accent-primary" />
            They replied
          </label>
        ) : (
          <span />
        )}
        <SubmitButton pendingText="Saving…">Add {KINDS.find((k) => k.value === kind)!.label.toLowerCase()}</SubmitButton>
      </div>
    </form>
  );
}
