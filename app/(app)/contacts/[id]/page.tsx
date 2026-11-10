import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon, MailIcon, PencilIcon, PhoneIcon } from "lucide-react";
import { getContact, getJobOptions, today } from "@/lib/data";
import { env } from "@/lib/env";
import { uuid } from "@/lib/validation";
import { deleteContact } from "@/lib/actions/contacts";
import { ContactStatusBadge, JobStatusBadge } from "@/components/badges";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Section } from "@/components/page-header";
import { ActivityForm } from "@/components/activity-form";
import { ActivityTimeline } from "@/components/activity-timeline";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Recruiter" };

export default async function ContactDetailPage(props: PageProps<"/contacts/[id]">) {
  const { id } = await props.params;
  if (!uuid.safeParse(id).success) notFound();
  const [data, jobOptions] = await Promise.all([getContact(id), getJobOptions()]);
  if (!data) notFound();
  const { contact: c, jobs, activities } = data;

  return (
    <div className="grid gap-6">
      <Link href="/contacts" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> All recruiters
      </Link>

      <div className="grid gap-4 rounded-xl border bg-background p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
            {c.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">{c.name}</h1>
            <p className="text-sm text-muted-foreground">{[c.designation, c.company].filter(Boolean).join(" · ") || "—"}</p>
            <div className="mt-2">
              <ContactStatusBadge status={c.status} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.linkedin_url && (
            <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg" })}>
              <ExternalLinkIcon /> LinkedIn
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className={buttonVariants({ variant: "outline", size: "lg" })}>
              <MailIcon /> {c.email}
            </a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone}`} className={buttonVariants({ variant: "outline", size: "lg" })}>
              <PhoneIcon /> {c.phone}
            </a>
          )}
          <Link href={`/contacts/${c.id}/edit`} className={buttonVariants({ variant: "outline", size: "lg" })}>
            <PencilIcon /> Edit
          </Link>
          <div className="ml-auto">
            <ConfirmDelete
              title="Delete this recruiter?"
              description="Their outreach history will be deleted too. Jobs are kept."
              onConfirm={deleteContact.bind(null, c.id)}
            />
          </div>
        </div>
        {c.notes && <p className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{c.notes}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          <Section title="Log outreach or follow-up">
            <ActivityForm contactId={c.id} jobOptions={jobOptions.map((j) => ({ value: j.id, label: `${j.title} @ ${j.company}` }))} />
          </Section>
          <Section title="Outreach history">
            <ActivityTimeline activities={activities} today={today()} timeZone={env().APP_TIMEZONE} show="job" />
          </Section>
        </div>
        <Section title={`Jobs (${jobs.length})`}>
          {jobs.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Not linked to any job. Link from a job&apos;s page.
            </p>
          ) : (
            <ul className="divide-y rounded-xl border bg-background">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{j.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{j.company}</p>
                    </div>
                    <JobStatusBadge status={j.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
