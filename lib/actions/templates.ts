"use server";

import { db } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { formToObject, templateSchema, uuid } from "@/lib/validation";
import { dbError, refreshAll, throwIf, validationError } from "@/lib/actions/helpers";
import type { FormState } from "@/lib/types";

export async function saveTemplate(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const raw = formToObject(formData);
  const id = raw.id ? uuid.safeParse(raw.id) : null;
  if (id && !id.success) return { error: "Invalid template id." };

  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error);

  try {
    if (id?.success) throwIf(await db().from("templates").update(parsed.data).eq("id", id.data));
    else throwIf(await db().from("templates").insert(parsed.data));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}

export async function deleteTemplate(id: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(id).success) return { error: "Invalid template id." };
  try {
    throwIf(await db().from("templates").delete().eq("id", id));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}
