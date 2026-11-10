"use client";

import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const config = /environment configuration|SUPABASE|relation .* does not exist|Could not find the table/i.test(
    error.message,
  );
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlertIcon className="size-5 text-destructive" />
      </div>
      <h2 className="font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {config
          ? "The database isn't reachable or set up yet. Check SUPABASE_URL / SUPABASE_SECRET_KEY and that the migration SQL has been run."
          : "We couldn't load this page. Please try again."}
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>}
      <Button className="mt-4" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
