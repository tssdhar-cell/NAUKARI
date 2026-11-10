"use server";

import { db } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { getResume } from "@/lib/data";
import { formToObject, resumeSourceSchema, uuid } from "@/lib/validation";
import { dbError, refreshAll, throwIf, validationError } from "@/lib/actions/helpers";
import { RESUME_BUCKET } from "@/lib/storage";
import type { FormState } from "@/lib/types";


export async function setPrimaryResume(id: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(id).success) return { error: "Invalid resume id." };
  try {
    throwIf(await db().from("resumes").update({ is_primary: false }).eq("is_primary", true));
    throwIf(await db().from("resumes").update({ is_primary: true }).eq("id", id));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}

export async function renameResume(id: string, name: string): Promise<FormState> {
  await requireSession();
  const n = name.trim();
  if (!uuid.safeParse(id).success) return { error: "Invalid resume id." };
  if (!n || n.length > 120) return { error: "Name must be 1–120 characters." };
  try {
    throwIf(await db().from("resumes").update({ name: n }).eq("id", id));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}

export async function deleteResume(id: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(id).success) return { error: "Invalid resume id." };
  try {
    const r = await getResume(id);
    if (!r) return { error: "Resume not found." };
    const rm = await db().storage.from(RESUME_BUCKET).remove([r.storage_path]);
    if (rm.error) throw new Error(rm.error.message);
    throwIf(await db().from("resumes").delete().eq("id", id));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}

export async function saveResumeSource(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const raw = formToObject(formData);
  const id = raw.id ? uuid.safeParse(raw.id) : null;
  if (id && !id.success) return { error: "Invalid id." };

  const parsed = resumeSourceSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error);

  try {
    if (id?.success) throwIf(await db().from("resume_sources").update(parsed.data).eq("id", id.data));
    else throwIf(await db().from("resume_sources").insert(parsed.data));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}

export async function deleteResumeSource(id: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(id).success) return { error: "Invalid id." };
  try {
    throwIf(await db().from("resume_sources").delete().eq("id", id));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}
