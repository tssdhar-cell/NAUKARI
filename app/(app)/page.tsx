import { LayoutGridIcon } from "lucide-react";
import { getBoards } from "@/lib/data";
import { env } from "@/lib/env";
import { EmptyState, PageHeader } from "@/components/page-header";
import { BoardsView } from "@/components/boards-view";
import { BoardDialog } from "@/components/board-dialog";

export default async function BoardsPage() {
  const boards = await getBoards();

  if (boards.length) return <BoardsView boards={boards} timeZone={env().APP_TIMEZONE} />;

  return (
    <>
      <PageHeader
        title="Boards"
        description="Your saved job searches, one tap away"
        actions={
          <>
            <BoardDialog />
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
      ) : null}
    </>
  );
}
