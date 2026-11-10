import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchXIcon}
      title="Not found"
      description="This item doesn't exist or was deleted."
      action={
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </Link>
      }
    />
  );
}
