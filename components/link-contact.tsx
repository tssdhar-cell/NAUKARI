"use client";

import * as React from "react";
import Link from "next/link";
import { LinkIcon, Loader2Icon, UserPlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { linkContact, unlinkContact } from "@/lib/actions/jobs";
import type { Contact } from "@/lib/types";
import { ContactStatusBadge } from "@/components/badges";
import { NativeSelect } from "@/components/native-select";
import { Button, buttonVariants } from "@/components/ui/button";

export function JobContacts({
  jobId,
  contacts,
  options,
}: {
  jobId: string;
  contacts: Contact[];
  options: { value: string; label: string }[];
}) {
  const [selected, setSelected] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const linked = new Set(contacts.map((c) => c.id));
  const available = options.filter((o) => !linked.has(o.value));

  function run(fn: () => Promise<{ error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else toast.success(ok);
    });
  }

  return (
    <div className="grid gap-3">
      {contacts.length === 0 && <p className="text-sm text-muted-foreground">No recruiters linked yet.</p>}
      {contacts.length > 0 && (
        <ul className="grid gap-2">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <Link href={`/contacts/${c.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[c.designation, c.company].filter(Boolean).join(" · ") || c.email || "—"}
                </p>
              </Link>
              <ContactStatusBadge status={c.status} />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Unlink ${c.name}`}
                disabled={pending}
                onClick={() => run(() => unlinkContact(jobId, c.id), "Unlinked")}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <NativeSelect
          aria-label="Choose a recruiter"
          options={available}
          placeholder={available.length ? "Link existing recruiter…" : "No other recruiters"}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          disabled={!selected || pending}
          onClick={() =>
            run(async () => {
              const res = await linkContact(jobId, selected);
              if (!res.error) setSelected("");
              return res;
            }, "Recruiter linked")
          }
          className="h-10 md:h-9"
        >
          {pending ? <Loader2Icon className="animate-spin" /> : <LinkIcon />} Link
        </Button>
      </div>
      <Link href={`/contacts/new?job=${jobId}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "justify-self-start" })}>
        <UserPlusIcon /> Add new recruiter for this job
      </Link>
    </div>
  );
}
