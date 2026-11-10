import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireSession();
  return <AppShell>{children}</AppShell>;
}
