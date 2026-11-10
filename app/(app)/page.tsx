import Link from "next/link";
import {
  BellRingIcon,
  BriefcaseBusinessIcon,
  CalendarClockIcon,
  PlusIcon,
  SendIcon,
  TrophyIcon,
  XCircleIcon,
} from "lucide-react";
import { getDashboard } from "@/lib/data";
import { JOB_STATUSES } from "@/lib/constants";
import { formatDate, formatTime, relativeDay } from "@/lib/dates";
import { EmptyState, PageHeader, Section } from "@/components/page-header";
import { JobStatusBadge } from "@/components/badges";
import { CompleteToggle } from "@/components/complete-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const d = await getDashboard();

  const stats = [
    { label: "Jobs saved", value: d.total, icon: BriefcaseBusinessIcon, href: "/jobs" },
    { label: "Applied", value: d.applied, icon: SendIcon, href: "/jobs?status=applied" },
    { label: "Interviewing", value: d.byStatus.interviewing ?? 0, icon: CalendarClockIcon, href: "/jobs?status=interviewing" },
    { label: "Offers", value: d.byStatus.offer ?? 0, icon: TrophyIcon, href: "/jobs?status=offer" },
    { label: "Rejections", value: d.byStatus.rejected ?? 0, icon: XCircleIcon, href: "/jobs?status=rejected" },
    {
      label: "Pending follow-ups",
      value: d.pendingFollowUps,
      icon: BellRingIcon,
      href: "/follow-ups",
      note: d.overdueFollowUps ? `${d.overdueFollowUps} overdue` : undefined,
    },
  ];

  if (d.total === 0) {
    return (
      <>
        <PageHeader title="Dashboard" description="Your job search at a glance" />
        <EmptyState
          icon={BriefcaseBusinessIcon}
          title="No jobs yet"
          description="Found something on LinkedIn, Glassdoor or a careers page? Paste the link and start tracking it."
          action={
            <Link href="/jobs/new" className={buttonVariants({ size: "lg" })}>
              <PlusIcon /> Add your first job
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${d.addedThisWeek} job${d.addedThisWeek === 1 ? "" : "s"} added in the last 7 days`}
        actions={
          <Link href="/jobs/new" className={buttonVariants({ className: "hidden md:inline-flex" })}>
            <PlusIcon /> Add job
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, href, note }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border bg-background p-4 transition-colors hover:border-foreground/20"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{label}</span>
              <Icon className="size-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
            {note && <p className="text-xs font-medium text-rose-600">{note}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Section
          title="Upcoming follow-ups & interviews"
          className="lg:col-span-3"
          action={
            <Link href="/follow-ups" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          }
        >
          <div className="rounded-xl border bg-background">
            {d.upcoming.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing scheduled. Nice and clear.</p>
            ) : (
              <ul className="divide-y">
                {d.upcoming.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <CompleteToggle id={a.id} completed={false} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {a.title ?? (a.type === "interview" ? "Interview" : "Follow up")}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.job ? (
                          <Link href={`/jobs/${a.job.id}`} className="hover:underline">
                            {a.job.title} @ {a.job.company}
                          </Link>
                        ) : (
                          a.contact && (
                            <Link href={`/contacts/${a.contact.id}`} className="hover:underline">
                              {a.contact.name}
                            </Link>
                          )
                        )}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-right text-xs",
                        a.due_date! < d.today ? "font-medium text-rose-600" : a.due_date === d.today ? "font-medium text-amber-700" : "text-muted-foreground",
                      )}
                    >
                      {relativeDay(a.due_date!, d.today)}
                      {a.due_time && <span className="block">{formatTime(a.due_time)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section title="Status breakdown" className="lg:col-span-2">
          <div className="grid gap-3 rounded-xl border bg-background p-4">
            {JOB_STATUSES.map((s) => {
              const n = d.byStatus[s.value] ?? 0;
              const pct = d.total ? Math.round((n / d.total) * 100) : 0;
              return (
                <Link key={s.value} href={`/jobs?status=${s.value}`} className="group grid gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="group-hover:underline">{s.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {n} <span className="text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", s.bar)} style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section
          title="Recently added"
          action={
            <Link href="/jobs" className="text-xs text-muted-foreground hover:text-foreground">
              All jobs
            </Link>
          }
        >
          <JobMiniList jobs={d.recentJobs} meta={(j) => formatDate(j.date_added)} />
        </Section>
        <Section title="Recently updated">
          <JobMiniList jobs={d.recentlyUpdated} meta={(j) => formatDate(j.updated_at)} />
        </Section>
      </div>
    </>
  );
}

function JobMiniList<T extends { id: string; title: string; company: string; status: string }>({
  jobs,
  meta,
}: {
  jobs: T[];
  meta: (j: T) => string;
}) {
  return (
    <ul className="divide-y rounded-xl border bg-background">
      {jobs.map((j) => (
        <li key={j.id}>
          <Link href={`/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{j.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {j.company} · {meta(j)}
              </p>
            </div>
            <JobStatusBadge status={j.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
