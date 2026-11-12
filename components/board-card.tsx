"use client";

import * as React from "react";
import { CopyIcon, ExternalLinkIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteBoard, deleteSearch, duplicateSearch, markOpened } from "@/lib/actions/boards";
import { describeSearch, hostLabel } from "@/lib/linkedin";
import { isToday, timeAgo } from "@/lib/dates";
import type { Board, BoardWithSearches, Search } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchDialog } from "@/components/search-dialog";
import { BoardDialog } from "@/components/board-dialog";
import { SiteLogo } from "@/components/site-logo";
import { cn } from "@/lib/utils";

type BoardOption = Pick<Board, "id" | "name">;

function SearchTab({ search, boards, timeZone }: { search: Search; boards: BoardOption[]; timeZone: string }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const openedToday = isToday(search.last_opened_at, timeZone);
  const summary = describeSearch(search.url);

  function run(fn: () => Promise<{ error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else toast.success(ok);
    });
  }

  return (
    <li
      className={cn(
        "group flex items-stretch overflow-hidden rounded-xl border bg-background transition-colors hover:border-primary/40",
        openedToday && "border-primary/30 bg-primary/[0.03]",
      )}
    >
      <a
        href={search.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => startTransition(() => markOpened(search.id).then(() => undefined))}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{search.name}</p>
          <p className="truncate text-xs text-muted-foreground">{summary}</p>
        </div>
        <span
          className={cn(
            "hidden shrink-0 text-xs sm:block",
            openedToday ? "font-medium text-primary" : "text-muted-foreground",
          )}
        >
          {search.last_opened_at ? `opened ${timeAgo(search.last_opened_at)}` : "not opened yet"}
        </span>
        <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </a>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" aria-label="Tab options" className="h-auto rounded-none border-l" />}
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run(() => duplicateSearch(search.id), "Duplicated — edit the copy")} disabled={pending}>
            <CopyIcon /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2Icon /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SearchDialog boards={boards} search={search} open={editOpen} onOpenChange={setEditOpen} />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{search.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes the saved link. It can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => run(async () => {
                const r = await deleteSearch(search.id);
                if (!r.error) setConfirmOpen(false);
                return r;
              }, "Tab deleted")}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

export function BoardCard({ board, boards, timeZone }: { board: BoardWithSearches; boards: BoardOption[]; timeZone: string }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <section className="rounded-2xl border bg-muted/40 p-3 sm:p-4">
      <div className="mb-3 flex items-center gap-2">
        <SiteLogo url={board.home_url ?? board.searches[0]?.url} name={board.name} />
        <h2 className="min-w-0 flex-1 truncate font-semibold">{board.name}</h2>
        {board.home_url && (
          <a
            href={board.home_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-xs text-muted-foreground hover:text-foreground sm:inline-flex sm:items-center sm:gap-1"
          >
            {hostLabel(board.home_url)} <ExternalLinkIcon className="size-3" />
          </a>
        )}
        <SearchDialog boards={boards} boardId={board.id} />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Board options" />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <PencilIcon /> Edit board
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2Icon /> Delete board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {board.searches.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
          No tabs yet. Set up a search on {board.name}, copy the page link, and add it as a tab.
          <div className="mt-3">
            <SearchDialog
              boards={boards}
              boardId={board.id}
              trigger={<Button size="sm" />}
              triggerLabel={
                <>
                  <PlusIcon /> Add first tab
                </>
              }
            />
          </div>
        </div>
      ) : (
        <ul className="grid gap-2">
          {board.searches.map((s) => (
            <SearchTab key={s.id} search={s} boards={boards} timeZone={timeZone} />
          ))}
        </ul>
      )}

      <BoardDialog board={board} open={editOpen} onOpenChange={setEditOpen} />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{board.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This also deletes its {board.searches.length} tab{board.searches.length === 1 ? "" : "s"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await deleteBoard(board.id);
                  if (r.error) toast.error(r.error);
                  else {
                    setConfirmOpen(false);
                    toast.success("Board deleted");
                  }
                })
              }
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
