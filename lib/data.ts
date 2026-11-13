import "server-only";
import { db } from "@/lib/supabase";
import type { Board, BoardWithSearches, Resume, Search, Template } from "@/lib/types";
import { groupSearches } from "@/components/collection-utils";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ---------------------------------------------------------------------------
// Boards & searches
// ---------------------------------------------------------------------------
export async function getBoards(): Promise<BoardWithSearches[]> {
  const [boards, searches] = await Promise.all([
    db().from("boards").select("*").order("sort_order").order("created_at"),
    db().from("searches").select("*").order("sort_order").order("created_at"),
  ]);
  return groupSearches(unwrap(boards) as Board[], unwrap(searches) as Search[]);
}

export async function getSearch(id: string) {
  const res = await db().from("searches").select("*").eq("id", id).maybeSingle();
  return unwrap(res) as Search | null;
}

// ---------------------------------------------------------------------------
// Resumes (PDF versions)
// ---------------------------------------------------------------------------
export async function getResumes() {
  const res = await db().from("resumes").select("*").order("is_primary", { ascending: false }).order("created_at", { ascending: false });
  return unwrap(res) as Resume[];
}

export async function getResume(id: string) {
  const res = await db().from("resumes").select("*").eq("id", id).maybeSingle();
  return unwrap(res) as Resume | null;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
export async function getTemplates() {
  const res = await db().from("templates").select("*").order("name");
  return unwrap(res) as Template[];
}
