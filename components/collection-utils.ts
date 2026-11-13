import type { Board, BoardWithSearches, Resume, Search } from "../lib/types";

export function groupSearches(boards: Board[], searches: Search[]): BoardWithSearches[] {
  const grouped = new Map<string, Search[]>();
  for (const search of searches) {
    const group = grouped.get(search.board_id);
    if (group) group.push(search);
    else grouped.set(search.board_id, [search]);
  }
  return boards.map((board) => ({ ...board, searches: grouped.get(board.id) ?? [] }));
}

export function filterBoards(boards: BoardWithSearches[], query: string): BoardWithSearches[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return boards;
  return boards.flatMap((board) => {
    if (board.name.toLocaleLowerCase().includes(needle)) return [board];
    const searches = board.searches.filter((search) => `${search.name} ${search.url}`.toLocaleLowerCase().includes(needle));
    return searches.length ? [{ ...board, searches }] : [];
  });
}

export function selectResume(resumes: Resume[], selectedId: string | null): Resume | null {
  return resumes.find((resume) => resume.id === selectedId)
    ?? resumes.find((resume) => resume.is_primary)
    ?? resumes[0]
    ?? null;
}
