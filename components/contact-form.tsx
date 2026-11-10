"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveContact } from "@/lib/actions/contacts";
import { CONTACT_STATUSES } from "@/lib/constants";
import type { Contact } from "@/lib/types";
import { Field, FormError } from "@/components/field";
import { NativeSelect } from "@/components/native-select";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";

export function ContactForm({
  contact,
  linkJob,
}: {
  contact?: Contact;
  /** When adding from a job page: link the new recruiter to this job. */
  linkJob?: { id: string; company: string; title: string };
}) {
  const [state, action] = useActionState(saveContact, {});
  const err = state.fieldErrors ?? {};
  const cancelHref = linkJob ? `/jobs/${linkJob.id}` : contact ? `/contacts/${contact.id}` : "/contacts";

  return (
    <form action={action} className="grid gap-6" noValidate>
      {contact && <input type="hidden" name="id" value={contact.id} />}
      {linkJob && <input type="hidden" name="link_job_id" value={linkJob.id} />}
      <FormError message={state.error} />
      {linkJob && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Will be linked to <span className="font-medium text-foreground">{linkJob.title}</span> @ {linkJob.company}
        </p>
      )}

      <div className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 sm:p-5">
        <Field label="Name" htmlFor="name" error={err.name} required>
          <Input id="name" name="name" defaultValue={contact?.name} aria-invalid={!!err.name} required />
        </Field>
        <Field label="Company" htmlFor="company" error={err.company}>
          <Input id="company" name="company" defaultValue={contact?.company ?? linkJob?.company ?? ""} />
        </Field>
        <Field label="Designation" htmlFor="designation" error={err.designation}>
          <Input id="designation" name="designation" placeholder="Talent Acquisition Partner" defaultValue={contact?.designation ?? ""} />
        </Field>
        <Field label="Status" htmlFor="status" error={err.status}>
          <NativeSelect id="status" name="status" options={CONTACT_STATUSES} defaultValue={contact?.status ?? "not_contacted"} />
        </Field>
        <Field label="LinkedIn profile" htmlFor="linkedin_url" error={err.linkedin_url} className="sm:col-span-2">
          <Input
            id="linkedin_url"
            name="linkedin_url"
            type="url"
            inputMode="url"
            placeholder="https://www.linkedin.com/in/…"
            defaultValue={contact?.linkedin_url ?? ""}
            aria-invalid={!!err.linkedin_url}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={err.email}>
          <Input id="email" name="email" type="email" inputMode="email" defaultValue={contact?.email ?? ""} aria-invalid={!!err.email} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={err.phone}>
          <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={contact?.phone ?? ""} />
        </Field>
        <Field label="Notes" htmlFor="notes" error={err.notes} className="sm:col-span-2">
          <Textarea id="notes" name="notes" rows={4} defaultValue={contact?.notes ?? ""} />
        </Field>
      </div>

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", size: "lg", className: "flex-1 sm:flex-none" })}>
          Cancel
        </Link>
        <SubmitButton size="lg" className="flex-1 sm:flex-none" pendingText="Saving…">
          {contact ? "Save changes" : "Add recruiter"}
        </SubmitButton>
      </div>
    </form>
  );
}
