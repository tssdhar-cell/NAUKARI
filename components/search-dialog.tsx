"use client";

import * as React from "react";
import { useActionState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { saveSearch } from "@/lib/actions/boards";
import { describeSearch, getKeywords, hostLabel, isLinkedIn, setKeywords } from "@/lib/linkedin";
import type { Board, FormState, Search } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/field";
import { NativeSelect } from "@/components/native-select";
import { SubmitButton } from "@/components/submit-button";

/**
 * Add / edit a saved search tab.
 * Controlled (`open`/`onOpenChange`) when used from a menu; otherwise renders its own trigger button.
 */
export function SearchDialog({
  boards,
  boardId,
  search,
  open: controlledOpen,
  onOpenChange,
  trigger,
  triggerLabel,
}: {
  boards: Pick<Board, "id" | "name">[];
  boardId?: string;
  search?: Search;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Custom trigger element (uncontrolled mode). */
  trigger?: React.ReactElement;
  triggerLabel?: React.ReactNode;
}) {
  const [innerOpen, setInnerOpen] = React.useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;

  const [url, setUrl] = React.useState(search?.url ?? "");
  const linkedIn = isLinkedIn(url);
  const keywords = linkedIn ? getKeywords(url) : "";
  const summary = describeSearch(url);
  const summaryHint = summary && summary !== hostLabel(url) ? `Shows as: ${summary}` : undefined;

  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await saveSearch(prev, fd);
    if (res.ok) {
      setOpen(false);
      toast.success(search ? "Tab updated" : "Tab added");
      if (!search) setUrl("");
    }
    return res;
  }, {});
  const err = state.fieldErrors ?? {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger render={trigger ?? <Button variant="outline" size="sm" />}>
          {triggerLabel ?? (
            <>
              <PlusIcon /> Tab
            </>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{search ? "Edit tab" : "New tab"}</DialogTitle>
          <DialogDescription>
            Set up the search on the job site with the filters you want, then paste the page link here.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          {search && <input type="hidden" name="id" value={search.id} />}
          <FormError message={state.error && !state.fieldErrors ? state.error : undefined} />

          <Field label="Board" htmlFor="search-board" error={err.board_id}>
            <NativeSelect
              id="search-board"
              name="board_id"
              options={boards.map((b) => ({ value: b.id, label: b.name }))}
              defaultValue={search?.board_id ?? boardId ?? boards[0]?.id}
            />
          </Field>

          <Field label="Link" htmlFor="search-url" error={err.url} hint={summaryHint}>
            <Textarea
              id="search-url"
              name="url"
              rows={3}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/search-results/?keywords=AI%20Engineer&f_TPR=r86400"
              className="font-mono text-xs break-all"
              aria-invalid={!!err.url}
              required
            />
          </Field>

          {linkedIn && (
            <Field label="Keywords" htmlFor="search-kw" hint="Changes the keywords in the link above; the filters stay the same">
              <Input
                id="search-kw"
                value={keywords}
                onChange={(e) => setUrl(setKeywords(url, e.target.value))}
                placeholder="AI Engineer"
              />
            </Field>
          )}

          <Field label="Tab name" htmlFor="search-name" error={err.name}>
            <Input
              id="search-name"
              name="name"
              defaultValue={search?.name}
              placeholder={keywords || "AI Engineer"}
              aria-invalid={!!err.name}
              required
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingText="Saving…">{search ? "Save" : "Add tab"}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
