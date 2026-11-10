import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, BellIcon, CalendarIcon, MapPinIcon, PencilIcon } from "lucide-react";
import { getContactOptions, getJob, getTemplates, today } from "@/lib/data";
import { env } from "@/lib/env";
import { uuid } from "@/lib/validation";
import { formatDate, relativeDay } from "@/lib/dates";
import { deleteJob } from "@/lib/actions/jobs";
import { PlatformBadge } from "@/components/badges";
import { StatusSelect } from "@/components/status-select";
import { OpenListing } from "@/components/jobs-list";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Section } from "@/components/page-header";
import { JobContacts } from "@/components/link-contact";
import { ActivityForm } from "@/components/activity-form";
import { ActivityTimeline } from "@/components/activity-timeline";
import { TemplateComposer } from "@/components/template-composer";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata(props: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  if (!uuid.safeParse(id).success) return { title: "Job" };
  const data = await getJob(id);
  return { title: data ? `${data.job.title} @ ${data.job.company}` : "Job" };
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children || "—"}</dd>
    </div>
  );
}

export default async function JobDetailPage(props: PageProps<"/jobs/[id]">) {
  const { id } = await props.params;
  if (!uuid.safeParse(id).success) notFound();
  const [data, contactOptions, templates] = await Promise.all([getJob(id), getContactOptions(), getTemplates()]);
  if (!data) notFound();
  const { job, contacts, activities } = data;
  const t = today();

  return (
    <div className="grid gap-6">
      <Link href="/jobs" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> All jobs
      </Link>

      {/* Header */}
      <div className="grid gap-4 rounded-xl border bg-background p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{job.title}</h1>
            <p className="mt-0.5 text-muted-foreground">{job.company}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <PlatformBadge platform={job.platform} />
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-3" /> {job.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="size-3" /> Added {formatDate(job.date_added)}
              </span>
              {job.next_follow_up && (
                <span className={job.next_follow_up <= t ? "inline-flex items-center gap-1 font-medium text-amber-700" : "inline-flex items-center gap-1"}>
                  <BellIcon className="size-3" /> Follow up {relativeDay(job.next_follow_up, t).toLowerCase()}
                </span>
              )}
            </div>
          </div>
          <StatusSelect key={job.status} jobId={job.id} status={job.status} className="self-start" />
        </div>
        <div className="flex flex-wrap gap-2">
          {job.url ? (
            <div className="w-full sm:w-auto [&>a]:w-full">
              <OpenListing url={job.url} />
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No listing link saved.</span>
          )}
          <Link href={`/jobs/${job.id}/edit`} className={buttonVariants({ variant: "outline", size: "lg" })}>
            <PencilIcon /> Edit
          </Link>
          <div className="ml-auto">
            <ConfirmDelete
              title="Delete this job?"
              description="This also deletes its notes, follow-ups and activity. Linked recruiters are kept."
              onConfirm={deleteJob.bind(null, job.id)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          <Section title="Add update">
            <ActivityForm jobId={job.id} contactOptions={contactOptions.map((c) => ({ value: c.id, label: c.name }))} />
          </Section>
          <Section title="Activity">
            <ActivityTimeline activities={activities} today={t} timeZone={env().APP_TIMEZONE} />
          </Section>
        </div>

        <div className="grid content-start gap-6">
          <Section title="Details">
            <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-background p-4">
              <Detail label="Date applied">{job.date_applied && formatDate(job.date_applied)}</Detail>
              <Detail label="Experience">{job.experience}</Detail>
              <Detail label="Salary">{job.salary_range}</Detail>
              <Detail label="Next follow-up">{job.next_follow_up && formatDate(job.next_follow_up)}</Detail>
            </dl>
          </Section>

          <Section title="Personal notes">
            <div className="rounded-xl border bg-background p-4 text-sm whitespace-pre-wrap">
              {job.notes || <span className="text-muted-foreground">No notes. Use Edit to add some, or add a note update.</span>}
            </div>
          </Section>

          <Section title={`Recruiters (${contacts.length})`}>
            <JobContacts
              jobId={job.id}
              contacts={contacts}
              options={contactOptions.map((c) => ({ value: c.id, label: c.company ? `${c.name} · ${c.company}` : c.name }))}
            />
          </Section>

          <Section title="Message a recruiter">
            <div className="rounded-xl border bg-background p-4">
              <TemplateComposer
                templates={templates}
                contacts={contacts}
                jobId={job.id}
                company={job.company}
                role={job.title}
              />
            </div>
          </Section>

          {job.description && (
            <Section title="Job description">
              <div className="max-h-96 overflow-y-auto rounded-xl border bg-background p-4 text-sm whitespace-pre-wrap">
                {job.description}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
