import { CONTACT_STATUSES, JOB_STATUSES, PLATFORMS, labelOf } from "@/lib/constants";
import { cn } from "@/lib/utils";

const pill = "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap ring-1 ring-inset";

export function JobStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = JOB_STATUSES.find((x) => x.value === status);
  return <span className={cn(pill, s?.tone, className)}>{s?.label ?? status}</span>;
}

export function ContactStatusBadge({ status }: { status: string }) {
  const s = CONTACT_STATUSES.find((x) => x.value === status);
  return <span className={cn(pill, s?.tone)}>{s?.label ?? status}</span>;
}

export function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={cn(pill, "bg-background text-muted-foreground ring-border")}>{labelOf(PLATFORMS, platform)}</span>
  );
}
