"use server";

import { db } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { activitySchema, formToObject, uuid } from "@/lib/validation";
import { dbError, refreshAll, throwIf, validationError } from "@/lib/actions/helpers";
import type { FormState } from "@/lib/types";

export async function addActivity(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const raw = formToObject(formData);
  const parsed = activitySchema.safeParse({
    ...raw,
    job_id: raw.job_id || null,
    contact_id: raw.contact_id || null,
    response_received: raw.response_received === "on",
  });
  if (!parsed.success) return validationError(parsed.error);
  const a = parsed.data;
  const nextFollowUp = raw.next_follow_up ? raw.next_follow_up : null;
  if (nextFollowUp && !/^\d{4}-\d{2}-\d{2}$/.test(nextFollowUp)) {
    return { error: "Please fix the highlighted fields.", fieldErrors: { next_follow_up: ["Invalid date"] } };
  }

  const row = {
    job_id: a.job_id,
    contact_id: a.contact_id,
    type: a.type,
    title: a.title,
    body: a.body,
    method: a.type === "outreach" ? a.method : null,
    response_received: a.type === "outreach" ? a.response_received : null,
    due_date: a.type === "follow_up" || a.type === "interview" ? a.due_date : null,
    due_time: a.type === "interview" ? a.due_time : null,
  };

  try {
    throwIf(await db().from("activities").insert(row));
    if (a.type === "outreach") {
      if (a.contact_id) {
        const status = a.response_received ? "responded" : "contacted";
        throwIf(await db().from("contacts").update({ status }).eq("id", a.contact_id));
      }
      if (nextFollowUp) {
        throwIf(
          await db().from("activities").insert({
            job_id: a.job_id,
            contact_id: a.contact_id,
            type: "follow_up",
            title: "Follow up on outreach",
            due_date: nextFollowUp,
          }),
        );
      }
    }
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}

export async function setActivityCompleted(id: string, completed: boolean): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(id).success) return { error: "Invalid id." };
  try {
    throwIf(
      await db()
        .from("activities")
        .update({ completed_at: completed ? new Date().toISOString() : null })
        .eq("id", id),
    );
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}

export async function deleteActivity(id: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(id).success) return { error: "Invalid id." };
  try {
    throwIf(await db().from("activities").delete().eq("id", id));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}
