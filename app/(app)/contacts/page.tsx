import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, SearchIcon, UsersIcon } from "lucide-react";
import { getContacts } from "@/lib/data";
import { EmptyState, PageHeader } from "@/components/page-header";
import { ContactStatusBadge } from "@/components/badges";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Recruiters" };

export default async function ContactsPage(props: PageProps<"/contacts">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const contacts = await getContacts(q);

  return (
    <>
      <PageHeader
        title="Recruiters"
        description="Recruiters, hiring managers and referrals"
        actions={
          <Link href="/contacts/new" className={buttonVariants()}>
            <PlusIcon /> Add recruiter
          </Link>
        }
      />
      <form className="relative mb-4 sm:w-72" action="/contacts">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Search name or company" className="bg-background pl-8" aria-label="Search recruiters" />
      </form>

      {contacts.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={q ? "No matches" : "No recruiters yet"}
          description={q ? "Try another name or company." : "Keep track of who you've reached out to and when to follow up."}
          action={
            !q && (
              <Link href="/contacts/new" className={buttonVariants()}>
                <PlusIcon /> Add recruiter
              </Link>
            )
          }
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/contacts/${c.id}`}
                className="flex h-full items-start gap-3 rounded-xl border bg-background p-4 transition-colors hover:border-foreground/20"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[c.designation, c.company].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <ContactStatusBadge status={c.status} />
                    <span className="text-xs text-muted-foreground">
                      {c.job_count} job{c.job_count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
