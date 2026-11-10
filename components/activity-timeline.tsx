import Link from "next/link";
import {
  ArrowRightLeftIcon,
  BellIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  SendIcon,
  StickyNoteIcon,
} from "lucide-react";
import type { ActivityWithRefs } from "@/lib/types";
import { METHODS, labelOf } from "@/lib/constants";
import { formatDate, formatDateTime, formatTime, relativeDay } from "@/lib/dates";
import { deleteActivity } from "@/lib/actions/activities";
import { CompleteToggle } from "@/components/complete-toggle";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

const ICONS = {
  note: StickyNoteIcon,
  status_change: ArrowRightLeftIcon,
  outreach: SendIcon,
  follow_up: BellIcon,
  interview: CalendarClockIcon,
};

function headline(a: ActivityWithRefs) {
  switch (a.type) {
    case "note":
      return a.title ?? "Note";
    case "status_change":
      return `Status: ${a.title}`;
    case "outreach":
      return `Messaged ${a.contact?.name ?? "recruiter"}${a.method ? ` via ${labelOf(METHODS, a.method)}` : ""}`;
    case "follow_up":
      return a.title ?? "Follow up";
    case "interview":
      return a.title ?? "Interview";
  }
}

export function ActivityTimeline({
  activities,
  today,
  timeZone,
  show = "contact",
}: {
  activities: ActivityWithRefs[];
  today: string;
  timeZone: string;
  /** Which related record to link under each item. */
  show?: "job" | "contact";
}) {
  if (activities.length === 0) {
    return <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ol className="grid gap-0">
      {activities.map((a, i) => {
        const Icon = ICONS[a.type];
        const scheduled = a.type === "follow_up" || a.type === "interview";
        const overdue = scheduled && !a.completed_at && a.due_date && a.due_date < today;
        return (
          <li key={a.id} className="group relative flex gap-3 pb-5">
            {i < activities.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-border" />}
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", a.completed_at && "text-muted-foreground line-through")}>
                    {headline(a)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scheduled && a.due_date ? (
                      <span className={cn(overdue && "font-medium text-rose-600")}>
                        {formatDate(a.due_date)}
                        {a.due_time && ` · ${formatTime(a.due_time)}`}
                        {!a.completed_at && ` · ${relativeDay(a.due_date, today)}`}
                        {a.completed_at && " · done"}
                      </span>
                    ) : (
                      formatDateTime(a.created_at, timeZone)
                    )}
                    {show === "job" && a.job && (
                      <>
                        {" · "}
                        <Link href={`/jobs/${a.job.id}`} className="hover:underline">
                          {a.job.title} @ {a.job.company}
                        </Link>
                      </>
                    )}
                    {show === "contact" && a.contact && a.type !== "outreach" && (
                      <>
                        {" · "}
                        <Link href={`/contacts/${a.contact.id}`} className="hover:underline">
                          {a.contact.name}
                        </Link>
                      </>
                    )}
                    {a.type === "outreach" && a.response_received && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-emerald-700">
                        <CheckCircle2Icon className="size-3" /> replied
                      </span>
                    )}
                  </p>
                </div>
                {scheduled && <CompleteToggle id={a.id} completed={!!a.completed_at} />}
                <div className="opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                  {a.type !== "status_change" && (
                    <ConfirmDelete
                      iconOnly
                      label="Delete activity"
                      title="Delete this entry?"
                      description="This removes it from the timeline. This can't be undone."
                      onConfirm={deleteActivity.bind(null, a.id)}
                      successMessage="Deleted"
                    />
                  )}
                </div>
              </div>
              {a.body && (
                <div className="mt-2 rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm whitespace-pre-wrap">{a.body}</p>
                  {a.type === "outreach" && <CopyButton text={a.body} size="xs" className="mt-2" />}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
