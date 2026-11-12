import { LayoutGridIcon } from "lucide-react";
import { getBoards } from "@/lib/data";
import { env } from "@/lib/env";
import { EmptyState, PageHeader } from "@/components/page-header";
import { BoardCard } from "@/components/board-card";
import { BoardDialog } from "@/components/board-dialog";
import { SearchDialog } from "@/components/search-dialog";

export default async function BoardsPage() {
  const boards = await getBoards();
  const options = boards.map((b) => ({ id: b.id, name: b.name }));

  return (
    <>
      <PageHeader
        title="Boards"
        description="Your saved job searches, one tap away"
        actions={
          <>
            <BoardDialog />
            {boards.length > 0 && <SearchDialog boards={options} />}
          </>
        }
      />

      {boards.length === 0 ? (
        <EmptyState
          icon={LayoutGridIcon}
          title="No boards yet"
          description="Add a board for each site you search on (LinkedIn, Naukri, Indeed…), then save your searches as tabs."
          action={<BoardDialog />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {boards.map((b) => (
            <BoardCard key={b.id} board={b} boards={options} timeZone={env().APP_TIMEZONE} />
          ))}
        </div>
      )}
    </>
  );
}
