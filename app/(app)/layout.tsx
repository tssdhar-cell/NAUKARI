import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/session";
import { getFollowUps } from "@/lib/data";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireSession();
  let due = 0;
  try {
    const f = await getFollowUps();
    due = f.overdue.length + f.dueToday.length;
  } catch {
    // Sidebar badge is optional; the page itself will surface DB errors.
  }
  return <AppShell followUpsDue={due}>{children}</AppShell>;
}
