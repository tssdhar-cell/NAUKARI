"use client";

import * as React from "react";
import { useActionState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { saveBoard } from "@/lib/actions/boards";
import type { Board, FormState } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";

export function BoardDialog({
  board,
  open: controlledOpen,
  onOpenChange,
}: {
  board?: Board;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [innerOpen, setInnerOpen] = React.useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;

  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await saveBoard(prev, fd);
    if (res.ok) {
      setOpen(false);
      toast.success(board ? "Board updated" : "Board added");
    }
    return res;
  }, {});
  const err = state.fieldErrors ?? {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <PlusIcon /> Board
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{board ? "Edit board" : "New board"}</DialogTitle>
          <DialogDescription>A job site you search on, e.g. LinkedIn, Naukri, Indeed, Wellfound.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          {board && <input type="hidden" name="id" value={board.id} />}
          <FormError message={state.error && !state.fieldErrors ? state.error : undefined} />
          <Field label="Name" htmlFor="board-name" error={err.name}>
            <Input id="board-name" name="name" defaultValue={board?.name} placeholder="Naukri" required aria-invalid={!!err.name} />
          </Field>
          <Field label="Home link" htmlFor="board-url" error={err.home_url} hint="Optional — the site's jobs page">
            <Input
              id="board-url"
              name="home_url"
              type="url"
              inputMode="url"
              defaultValue={board?.home_url ?? ""}
              placeholder="https://www.naukri.com/"
              aria-invalid={!!err.home_url}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingText="Saving…">{board ? "Save" : "Add board"}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
