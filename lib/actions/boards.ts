"use server";

import { db } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { getSearch } from "@/lib/data";
import { cleanUrl } from "@/lib/linkedin";
import { boardSchema, formToObject, searchSchema, uuid } from "@/lib/validation";
import { dbError, throwIf, validationError } from "@/lib/actions/helpers";
import type { FormState } from "@/lib/types";

export async function saveBoard(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const raw = formToObject(formData);
  const id = raw.id ? uuid.safeParse(raw.id) : null;
  if (id && !id.success) return { error: "Invalid board id." };

  const parsed = boardSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error);

  try {
    if (id?.success) throwIf(await db().from("boards").update(parsed.data).eq("id", id.data));
    else {
      const max = await db().from("boards").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      throwIf(max);
      throwIf(await db().from("boards").insert({ ...parsed.data, sort_order: (max.data?.sort_order ?? -1) + 1 }));
    }
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBoard(id: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(id).success) return { error: "Invalid board id." };
  try {
    throwIf(await db().from("boards").delete().eq("id", id));
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/");
  return { ok: true };
}

export async function saveSearch(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const raw = formToObject(formData);
  const id = raw.id ? uuid.safeParse(raw.id) : null;
  if (id && !id.success) return { error: "Invalid tab id." };

  const parsed = searchSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error);
  const row = { ...parsed.data, url: cleanUrl(parsed.data.url) };

  try {
    if (id?.success) throwIf(await db().from("searches").update(row).eq("id", id.data));
    else {
      const max = await db()
        .from("searches")
        .select("sort_order")
        .eq("board_id", row.board_id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      throwIf(max);
      throwIf(await db().from("searches").insert({ ...row, sort_order: (max.data?.sort_order ?? -1) + 1 }));
    }
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/");
  return { ok: true };
}

export async function duplicateSearch(id: string): Promise<FormState & { id?: string }> {
  await requireSession();
  if (!uuid.safeParse(id).success) return { error: "Invalid tab id." };
  try {
    const src = await getSearch(id);
    if (!src) return { error: "Tab not found." };
    const res = await db()
      .from("searches")
      .insert({ board_id: src.board_id, name: `${src.name} (copy)`, url: src.url, sort_order: src.sort_order + 1 })
      .select("id")
      .single();
    throwIf(res);
    revalidatePath("/");
    return { ok: true, id: res.data!.id };
  } catch (e) {
    return dbError(e);
  }
}

export async function deleteSearch(id: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(id).success) return { error: "Invalid tab id." };
  try {
    throwIf(await db().from("searches").delete().eq("id", id));
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/");
  return { ok: true };
}

/** Stamp last_opened_at when a tab is clicked. Fire-and-forget from the client. */
export async function markOpened(id: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(id).success) return { error: "Invalid tab id." };
  try {
    throwIf(await db().from("searches").update({ last_opened_at: new Date().toISOString() }).eq("id", id));
  } catch (e) {
    return dbError(e);
  }
  // The client updates the timestamp optimistically. Avoid re-rendering the
  // entire route for a background analytics-style write.
  return { ok: true };
}
