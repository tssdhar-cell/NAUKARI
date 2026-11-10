import type { Metadata } from "next";
import { DownloadIcon, LogOutIcon } from "lucide-react";
import { getSession } from "@/lib/session";
import { env } from "@/lib/env";
import { logout } from "@/lib/actions/auth";
import { PageHeader, Section } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Settings" };

const EXPORTS = [
  { table: "jobs", label: "Jobs" },
  { table: "contacts", label: "Recruiters" },
  { table: "activities", label: "Activity & follow-ups" },
  { table: "templates", label: "Templates" },
];

export default async function SettingsPage() {
  const session = await getSession();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" />
      <div className="grid gap-6">
        <Section title="Account">
          <dl className="grid gap-3 rounded-xl border bg-background p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Signed in as</dt>
              <dd className="mt-0.5 font-medium">{session?.username}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Timezone</dt>
              <dd className="mt-0.5">{env().APP_TIMEZONE}</dd>
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              To change the username or password, update <code>ADMIN_USERNAME</code> / <code>ADMIN_PASSWORD</code> in Vercel →
              Settings → Environment Variables and redeploy.
            </p>
          </dl>
        </Section>

        <Section title="Export data (CSV)">
          <div className="flex flex-wrap gap-2 rounded-xl border bg-background p-4">
            {EXPORTS.map((e) => (
              <a key={e.table} href={`/api/export/${e.table}`} className={buttonVariants({ variant: "outline" })} download>
                <DownloadIcon /> {e.label}
              </a>
            ))}
          </div>
        </Section>

        <Section title="Session">
          <form action={logout} className="rounded-xl border bg-background p-4">
            <SubmitButton variant="outline" pendingText="Signing out…">
              <LogOutIcon /> Log out
            </SubmitButton>
          </form>
        </Section>
      </div>
    </div>
  );
}
