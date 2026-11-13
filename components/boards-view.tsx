"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { PlusIcon } from "lucide-react";
import type { BoardWithSearches, Search } from "@/lib/types";
import { BoardCard } from "@/components/board-card";
import { BoardDialog } from "@/components/board-dialog";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { filterBoards } from "@/components/collection-utils";

const SearchDialog = dynamic(() => import("@/components/search-dialog").then((module) => module.SearchDialog), {
  loading: () => <p role="status" className="text-sm text-muted-foreground">Loading editor…</p>,
});

export function BoardsView({ boards, timeZone }: { boards: BoardWithSearches[]; timeZone: string }) {
  const [query, setQuery] = React.useState("");
  const [editor, setEditor] = React.useState<{ boardId?: string; search?: Search } | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(12);
  const filtered = filterBoards(boards, query);
  const options = boards.map(({ id, name }) => ({ id, name }));
  const counts = new Map(boards.map((board) => [board.id, board.searches.length]));

  return <>
    <PageHeader title="Boards" description="Your saved job searches, one tap away" actions={<>
      <BoardDialog />
      <Button variant="outline" onClick={() => setEditor({})}><PlusIcon /> Tab</Button>
    </>} />
    <div className="mb-4">
      <label htmlFor="board-filter" className="mb-1.5 block text-sm font-medium">Find a board or saved search</label>
      <Input id="board-filter" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(12); }} placeholder="Search names or links" />
      <p className="mt-1 text-xs text-muted-foreground" role="status">{filtered.length} of {boards.length} boards</p>
    </div>
    {filtered.length ? <div className="grid items-start gap-4 lg:grid-cols-2">
      {filtered.slice(0, visibleCount).map((board) => <BoardCard key={board.id} board={board} totalSearches={counts.get(board.id)!} timeZone={timeZone} onEditSearch={(search) => setEditor({ search })} onAddSearch={() => setEditor({ boardId: board.id })} />)}
    </div> : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No matching boards or searches. Try another term.</p>}
    {filtered.length > visibleCount && <Button className="mt-4" variant="outline" onClick={() => setVisibleCount((count) => count + 12)}>Show more boards ({filtered.length - visibleCount} remaining)</Button>}
    {editor && <SearchDialog boards={options} boardId={editor.boardId} search={editor.search} open onOpenChange={(open) => { if (!open) setEditor(null); }} />}
  </>;
}
