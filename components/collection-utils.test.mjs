import test from "node:test";
import assert from "node:assert/strict";
import { groupSearches, filterBoards, selectResume } from "./collection-utils.ts";

const boards = [{ id: "a", name: "LinkedIn" }, { id: "b", name: "Naukri" }, { id: "c", name: "Empty" }];
const searches = [
  { id: "1", board_id: "b", name: "Designer", url: "https://example.test/design" },
  { id: "2", board_id: "a", name: "Engineer", url: "https://example.test/software" },
  { id: "3", board_id: "a", name: "Manager", url: "https://example.test/manage" },
];

test("grouping preserves board order, per-board search order, and empty boards", () => {
  const result = groupSearches(boards, searches);
  assert.deepEqual(result.map((board) => [board.id, board.searches.map((search) => search.id)]), [["a", ["2", "3"]], ["b", ["1"]], ["c", []]]);
  assert.equal("searches" in boards[0], false);
});

test("filter matches board names, search names and links without changing original collections", () => {
  const grouped = groupSearches(boards, searches);
  assert.deepEqual(filterBoards(grouped, "  LINKEDIN ")[0].searches.map((search) => search.id), ["2", "3"]);
  assert.deepEqual(filterBoards(grouped, "engineer")[0].searches.map((search) => search.id), ["2"]);
  assert.equal(filterBoards(grouped, "design")[0].id, "b");
  assert.equal(filterBoards(grouped, "software")[0].id, "a");
  assert.deepEqual(filterBoards(grouped, "missing"), []);
  assert.equal(filterBoards(grouped, " "), grouped);
  assert.equal(grouped[0].searches.length, 2);
});

test("deleted resume selection falls back to primary then first and handles an empty collection", () => {
  const resumes = [{ id: "first", is_primary: false }, { id: "primary", is_primary: true }];
  assert.equal(selectResume(resumes, "first").id, "first");
  assert.equal(selectResume(resumes, "deleted").id, "primary");
  assert.equal(selectResume(resumes.slice(0, 1), "deleted").id, "first");
  assert.equal(selectResume([], "deleted"), null);
});
