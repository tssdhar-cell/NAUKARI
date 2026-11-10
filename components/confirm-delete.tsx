"use client";

import * as React from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/types";

export function ConfirmDelete({
  title,
  description,
  onConfirm,
  label = "Delete",
  iconOnly = false,
  successMessage,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<FormState | void>;
  label?: string;
  iconOnly?: boolean;
  successMessage?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function confirm() {
    startTransition(async () => {
      const res = await onConfirm();
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setOpen(false);
      if (successMessage) toast.success(successMessage);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant={iconOnly ? "ghost" : "destructive"}
            size={iconOnly ? "icon-sm" : "default"}
            aria-label={label}
          />
        }
      >
        <Trash2Icon />
        {!iconOnly && label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
