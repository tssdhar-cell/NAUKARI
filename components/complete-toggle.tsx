"use client";

import * as React from "react";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { setActivityCompleted } from "@/lib/actions/activities";
import { cn } from "@/lib/utils";

export function CompleteToggle({ id, completed }: { id: string; completed: boolean }) {
  const [pending, startTransition] = React.useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={completed ? "Mark as not done" : "Mark as done"}
      onClick={() =>
        startTransition(async () => {
          const res = await setActivityCompleted(id, !completed);
          if (res.error) toast.error(res.error);
          else toast.success(completed ? "Reopened" : "Marked as done");
        })
      }
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        completed
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-muted-foreground/40 hover:border-emerald-500 hover:bg-emerald-50",
      )}
    >
      {pending ? <Loader2Icon className="size-3.5 animate-spin" /> : completed && <CheckIcon className="size-3.5" />}
    </button>
  );
}
