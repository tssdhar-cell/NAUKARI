import type { Metadata } from "next";
import Link from "next/link";
import { BellRingIcon, CalendarClockIcon } from "lucide-react";
import { getFollowUps } from "@/lib/data";
import { formatDate, formatTime, relativeDay } from "@/lib/dates";
import type { ActivityWithRefs } from "@/lib/types";
import { EmptyState, PageHeader, Section } from "@/components/page-header";
import { CompleteToggle } from "@/components/complete-toggle";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Follow-ups" };

function Item({ a, today }: { a: ActivityWithRefs; today: string }) {
  const done = !!a.completed_at;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <CompleteToggle id={a.id} completed={done} />
      <div className="min-w-0 flex-1">
        <p className={cn("flex items-center gap-1.5 truncate text-sm font-medium", done && "text-muted-foreground line-through")}>
          {a.type === "interview" && <CalendarClockIcon className="size-3.5 shrink-0 text-amber-600" />}
          {a.title ?? (a.type === "interview" ? "Interview" : "Follow up")}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {a.job && (
            <Link href={`/jobs/${a.job.id}`} className="hover:underline">
              {a.job.title} @ {a.job.company}
            </Link>
          )}
          {a.job && a.contact && " · "}
          {a.contact && (
            <Link href={`/contacts/${a.contact.id}`} className="hover:underline">
              {a.contact.name}
            </Link>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs">
        <p className={cn(!done && a.due_date! < today ? "font-medium text-rose-600" : "text-muted-foreground")}>
          {formatDate(a.due_date)}
          {a.due_time && ` · ${formatTime(a.due_time)}`}
        </p>
        {!done && <p className="text-muted-foreground">{relativeDay(a.due_date!, today)}</p>}
      </div>
    </li>
  );
}

function Group({ title, items, today, tone }: { title: string; items: ActivityWithRefs[]; today: string; tone?: string }) {
  if (items.length === 0) return null;
  return (
    <Section
      title={
        <span className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", tone ?? "bg-muted-foreground/40")} />
          {title} <span className="font-normal text-muted-foreground">{items.length}</span>
        </span>
      }
    >
      <ul className="divide-y rounded-xl border bg-background">
        {items.map((a) => (
          <Item key={a.id} a={a} today={today} />
        ))}
      </ul>
    </Section>
  );
}

export default async function FollowUpsPage() {
  const f = await getFollowUps();
  const nothingOpen = f.overdue.length + f.dueToday.length + f.upcoming.length === 0;

  return (
    <>
      <PageHeader title="Follow-ups" description="Follow-ups and interviews across all jobs and recruiters" />
      <div className="grid gap-6">
        {nothingOpen && (
          <EmptyState
            icon={BellRingIcon}
            title="You're all caught up"
            description="Add follow-ups or interviews from a job or recruiter page, or set a follow-up date when saving a job."
          />
        )}
        <Group title="Overdue" items={f.overdue} today={f.today} tone="bg-rose-500" />
        <Group title="Today" items={f.dueToday} today={f.today} tone="bg-amber-500" />
        <Group title="Upcoming" items={f.upcoming} today={f.today} tone="bg-blue-500" />
        <Group title="Completed" items={f.completed} today={f.today} tone="bg-emerald-500" />
      </div>
    </>
  );
}
