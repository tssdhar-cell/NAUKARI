"use client";

import * as React from "react";
import { CopyIcon, ExternalLinkIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteBoard, deleteSearch, duplicateSearch, markOpened } from "@/lib/actions/boards";
import { describeSearch, hostLabel } from "@/lib/linkedin";
import { isToday, timeAgo } from "@/lib/dates";
import type { BoardWithSearches, Search } from "@/lib/types";
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
import { BoardDialog } from "@/components/board-dialog";
import { SiteLogo } from "@/components/site-logo";
import { cn } from "@/lib/utils";

function SearchTab({ search, onEdit, timeZone }: { search: Search; onEdit: () => void; timeZone: string }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [localOpened, setLocalOpened] = React.useState<string | null>(null);
  const opening = React.useRef(false);
  const lastOpened = localOpened ?? search.last_opened_at;
  const openedToday = isToday(lastOpened, timeZone);
  const summary = describeSearch(search.url);

  async function trackOpened() {
    if (opening.current) return;
    opening.current = true;
    const previous = localOpened;
    setLocalOpened(new Date().toISOString());
    try {
      const result = await markOpened(search.id);
      if (result.error) throw new Error(result.error);
    } catch {
      setLocalOpened(previous);
      toast.error("Search opened, but its opened status could not be saved.");
    } finally {
      opening.current = false;
    }
  }

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
        onClick={() => { void trackOpened(); }}
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
          {lastOpened ? `opened ${timeAgo(lastOpened)}` : "not opened yet"}
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
          <DropdownMenuItem onClick={onEdit}>
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

export function BoardCard({ board, totalSearches, onAddSearch, onEditSearch, timeZone }: { board: BoardWithSearches; totalSearches: number; onAddSearch: () => void; onEditSearch: (search: Search) => void; timeZone: string }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [visibleCount, setVisibleCount] = React.useState(10);

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
        <Button variant="outline" size="sm" onClick={onAddSearch}><PlusIcon /> Tab</Button>
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
            <Button size="sm" onClick={onAddSearch}><PlusIcon /> Add first tab</Button>
          </div>
        </div>
      ) : (
        <ul className="grid gap-2">
          {board.searches.slice(0, visibleCount).map((s) => (
            <SearchTab key={s.id} search={s} onEdit={() => onEditSearch(s)} timeZone={timeZone} />
          ))}
        </ul>
      )}

      {board.searches.length > visibleCount && <Button className="mt-3" variant="outline" onClick={() => setVisibleCount((count) => count + 10)}>Show more tabs ({board.searches.length - visibleCount} remaining)</Button>}

      <BoardDialog board={board} open={editOpen} onOpenChange={setEditOpen} />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{board.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This also deletes its {totalSearches} tab{totalSearches === 1 ? "" : "s"}.
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
