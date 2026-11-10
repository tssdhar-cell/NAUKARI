"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { contactSchema, formToObject, uuid } from "@/lib/validation";
import { dbError, refreshAll, throwIf, validationError } from "@/lib/actions/helpers";
import type { FormState } from "@/lib/types";

export async function saveContact(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const raw = formToObject(formData);
  const id = raw.id ? uuid.safeParse(raw.id) : null;
  if (id && !id.success) return { error: "Invalid recruiter id." };
  const linkJob = raw.link_job_id ? uuid.safeParse(raw.link_job_id) : null;

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error);

  let contactId: string;
  try {
    if (id?.success) {
      contactId = id.data;
      throwIf(await db().from("contacts").update(parsed.data).eq("id", contactId));
    } else {
      const res = await db().from("contacts").insert(parsed.data).select("id").single();
      throwIf(res);
      contactId = res.data!.id;
    }
    if (linkJob?.success) {
      throwIf(
        await db()
          .from("job_contacts")
          .upsert({ job_id: linkJob.data, contact_id: contactId }, { onConflict: "job_id,contact_id", ignoreDuplicates: true }),
      );
    }
  } catch (e) {
    return dbError(e);
  }

  refreshAll();
  redirect(linkJob?.success ? `/jobs/${linkJob.data}` : `/contacts/${contactId}`);
}

export async function deleteContact(contactId: string): Promise<FormState> {
  await requireSession();
  if (!uuid.safeParse(contactId).success) return { error: "Invalid recruiter id." };
  try {
    throwIf(await db().from("contacts").delete().eq("id", contactId));
  } catch (e) {
    return dbError(e);
  }
  refreshAll();
  redirect("/contacts");
}
