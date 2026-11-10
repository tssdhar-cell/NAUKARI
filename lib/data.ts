import "server-only";
import { db } from "@/lib/supabase";
import type { Board, BoardWithSearches, Resume, ResumeSource, Search, Template } from "@/lib/types";

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
  const all = unwrap(searches) as Search[];
  return (unwrap(boards) as Board[]).map((b) => ({ ...b, searches: all.filter((s) => s.board_id === b.id) }));
}

export async function getSearch(id: string) {
  const res = await db().from("searches").select("*").eq("id", id).maybeSingle();
  return unwrap(res) as Search | null;
}

// ---------------------------------------------------------------------------
// Resumes
// ---------------------------------------------------------------------------
export async function getResumes() {
  const res = await db().from("resumes").select("*").order("is_primary", { ascending: false }).order("created_at", { ascending: false });
  return unwrap(res) as Resume[];
}

export async function getResume(id: string) {
  const res = await db().from("resumes").select("*").eq("id", id).maybeSingle();
  return unwrap(res) as Resume | null;
}

export async function getResumeSources() {
  const res = await db().from("resume_sources").select("*").order("created_at");
  return unwrap(res) as ResumeSource[];
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
export async function getTemplates() {
  const res = await db().from("templates").select("*").order("name");
  return unwrap(res) as Template[];
}
