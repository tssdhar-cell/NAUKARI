import type { Metadata } from "next";
import { LogOutIcon } from "lucide-react";
import { getSession } from "@/lib/session";
import { env } from "@/lib/env";
import { logout } from "@/lib/actions/auth";
import { PageHeader, Section } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Settings" };

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
