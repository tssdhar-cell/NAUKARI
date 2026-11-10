"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { getOpenFollowUp, today } from "@/lib/data";
import { formToObject, jobSchema, uuid } from "@/lib/validation";
import { JOB_STATUS_VALUES, JOB_STATUSES, labelOf, type JobStatus } from "@/lib/constants";
import { dbError, refreshAll, throwIf, validationError } from "@/lib/actions/helpers";
import type { FormState } from "@/lib/types";

async function logStatusChange(jobId: string, from: string, to: string) {
  throwIf(
    await db()
      .from("activities")
      .insert({
        job_id: jobId,
        type: "status_change",
        title: `${labelOf(JOB_STATUSES, from)} → ${labelOf(JOB_STATUSES, to)}`,
      }),
  );
}

async function syncFollowUp(jobId: string, date: string | null) {
  const open = await getOpenFollowUp(jobId);
  if (date && open) {
    if (open.due_date !== date) throwIf(await db().from("activities").update({ due_date: date }).eq("id", open.id));
  } else if (date) {
    throwIf(await db().from("activities").insert({ job_id: jobId, type: "follow_up", title: "Follow up", due_date: date }));
  } else if (open) {
    throwIf(await db().from("activities").delete().eq("id", open.id));
  }
}

export async function saveJob(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const raw = formToObject(formData);
  const id = raw.id ? uuid.safeParse(raw.id) : null;
  if (id && !id.success) return { error: "Invalid job id." };

  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error);
  const { follow_up_date, ...fields } = parsed.data;
  if (["applied", "interviewing", "offer"].includes(fields.status) && !fields.date_applied) {
    fields.date_applied = today();
  }

  let jobId: string;
  try {
    if (id?.success) {
      jobId = id.data;
      const before = await db().from("jobs").select("status").eq("id", jobId).single();
      throwIf(before);
      throwIf(await db().from("jobs").update(fields).eq("id", jobId));
      if (before.data!.status !== fields.status) await logStatusChange(jobId, before.data!.status, fields.status);
    } else {
      const res = await db().from("jobs").insert(fields).select("id").single();
      throwIf(res);
      jobId = res.data!.id;
    }
    await syncFollowUp(jobId, follow_up_date);
  } catch (e) {
    return dbError(e);
  }

  refreshAll();
  redirect(`/jobs/${jobId}`);
}

export async function updateJobStatus(jobId: string, status: JobStatus): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(jobId).success || !JOB_STATUS_VALUES.includes(status)) return { error: "Invalid input." };
  try {
    const before = await db().from("jobs").select("status, date_applied").eq("id", jobId).single();
    throwIf(before);
    if (before.data!.status === status) return { ok: true };
    const patch: Record<string, unknown> = { status };
    if (["applied", "interviewing", "offer"].includes(status) && !before.data!.date_applied) patch.date_applied = today();
    throwIf(await db().from("jobs").update(patch).eq("id", jobId));
    await logStatusChange(jobId, before.data!.status, status);
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}

export async function deleteJob(jobId: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(jobId).success) return { error: "Invalid job id." };
  try {
    throwIf(await db().from("jobs").delete().eq("id", jobId));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  redirect("/jobs");
}

export async function linkContact(jobId: string, contactId: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(jobId).success || !uuid.safeParse(contactId).success) return { error: "Pick a recruiter." };
  try {
    throwIf(
      await db()
        .from("job_contacts")
        .upsert({ job_id: jobId, contact_id: contactId }, { onConflict: "job_id,contact_id", ignoreDuplicates: true }),
    );
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}

export async function unlinkContact(jobId: string, contactId: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(jobId).success || !uuid.safeParse(contactId).success) return { error: "Invalid input." };
  try {
    throwIf(await db().from("job_contacts").delete().eq("job_id", jobId).eq("contact_id", contactId));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  return { ok: true };
}
