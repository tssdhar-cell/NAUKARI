import Link from "next/link";
import { BellIcon, ExternalLinkIcon, MapPinIcon } from "lucide-react";
import type { JobWithFollowUp } from "@/lib/types";
import { formatDate, relativeDay } from "@/lib/dates";
import { JOB_STATUSES } from "@/lib/constants";
import { JobStatusBadge, PlatformBadge } from "@/components/badges";
import { StatusSelect } from "@/components/status-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function FollowUp({ date, today }: { date: string | null; today: string }) {
  if (!date) return <span className="text-muted-foreground">—</span>;
  const overdue = date < today;
  return (
    <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-rose-600", date === today && "font-medium text-amber-700")}>
      {formatDate(date)}
      {(overdue || date === today) && <span className="text-xs">({relativeDay(date, today)})</span>}
    </span>
  );
}

export function OpenListing({ url, compact = false }: { url: string | null; compact?: boolean }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: compact ? "outline" : "default", size: compact ? "sm" : "lg" })}
    >
      <ExternalLinkIcon /> {compact ? "Open" : "Open job listing"}
    </a>
  );
}

export function JobsTable({ jobs, today }: { jobs: JobWithFollowUp[]; today: string }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Role</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="w-0 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} className="group">
                <TableCell className="max-w-72 pl-4">
                  <Link href={`/jobs/${job.id}`} className="block truncate font-medium hover:underline">
                    {job.title}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">{job.company}</span>
                </TableCell>
                <TableCell>
                  <PlatformBadge platform={job.platform} />
                </TableCell>
                <TableCell className="max-w-40 truncate text-muted-foreground">{job.location ?? "—"}</TableCell>
                <TableCell>
                  <JobStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(job.date_added)}</TableCell>
                <TableCell>
                  <FollowUp date={job.next_follow_up} today={today} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <OpenListing url={job.url} compact />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <ul className="grid gap-2 md:hidden">
        {jobs.map((job) => (
          <li key={job.id} className="rounded-xl border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium">{job.title}</p>
                <p className="truncate text-sm text-muted-foreground">{job.company}</p>
              </Link>
              <JobStatusBadge status={job.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <PlatformBadge platform={job.platform} />
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-3" /> {job.location}
                </span>
              )}
              <span>Added {formatDate(job.date_added)}</span>
              {job.next_follow_up && (
                <span className="inline-flex items-center gap-1">
                  <BellIcon className="size-3" /> <FollowUp date={job.next_follow_up} today={today} />
                </span>
              )}
            </div>
            {job.url && (
              <div className="mt-3">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", className: "w-full" })}
                >
                  <ExternalLinkIcon /> Open listing
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export function JobsKanban({ jobs, today }: { jobs: JobWithFollowUp[]; today: string }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      {JOB_STATUSES.map((s) => {
        const col = jobs.filter((j) => j.status === s.value);
        return (
          <div key={s.value} className="flex w-[80vw] max-w-72 shrink-0 snap-start flex-col rounded-xl bg-muted/60 p-2 sm:w-64">
            <div className="mb-2 flex items-center gap-2 px-1.5 pt-1">
              <span className={cn("size-2 rounded-full", s.bar)} />
              <span className="text-sm font-medium">{s.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{col.length}</span>
            </div>
            <div className="grid gap-2">
              {col.length === 0 && <p className="px-1.5 py-4 text-center text-xs text-muted-foreground">No jobs</p>}
              {col.map((job) => (
                <div key={job.id} className="rounded-lg border bg-background p-3 shadow-xs">
                  <Link href={`/jobs/${job.id}`} className="block">
                    <p className="line-clamp-2 text-sm font-medium">{job.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{job.company}</p>
                  </Link>
                  {job.next_follow_up && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <BellIcon className="size-3" /> <FollowUp date={job.next_follow_up} today={today} />
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <StatusSelect key={job.status} jobId={job.id} status={job.status} className="h-7 max-w-32" />
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open listing"
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      >
                        <ExternalLinkIcon />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
