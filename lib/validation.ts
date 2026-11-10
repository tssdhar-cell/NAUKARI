import { z } from "zod";
import {
  ACTIVITY_TYPE_VALUES,
  CONTACT_STATUS_VALUES,
  JOB_STATUS_VALUES,
  METHOD_VALUES,
  PLATFORM_VALUES,
} from "@/lib/constants";

/** Empty form strings become null; everything is trimmed. */
const optionalText = (max = 5000) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const requiredText = (label: string, max = 200) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max);

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v), "Enter a full link starting with http:// or https://");

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Invalid date");

const optionalTime = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{2}:\d{2}(:\d{2})?$/.test(v), "Invalid time");

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email");

export const uuid = z.uuid();

export const jobSchema = z.object({
  company: requiredText("Company"),
  title: requiredText("Job title"),
  url: optionalUrl,
  platform: z.enum(PLATFORM_VALUES),
  location: optionalText(200),
  description: optionalText(20000),
  experience: optionalText(100),
  salary_range: optionalText(100),
  status: z.enum(JOB_STATUS_VALUES),
  date_added: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date added is required"),
  date_applied: optionalDate,
  notes: optionalText(20000),
  follow_up_date: optionalDate,
});

export const contactSchema = z.object({
  name: requiredText("Name"),
  company: optionalText(200),
  designation: optionalText(200),
  linkedin_url: optionalUrl,
  email: optionalEmail,
  phone: optionalText(50),
  notes: optionalText(20000),
  status: z.enum(CONTACT_STATUS_VALUES),
});

export const activitySchema = z
  .object({
    type: z.enum(ACTIVITY_TYPE_VALUES).exclude(["status_change"]),
    job_id: uuid.nullable(),
    contact_id: uuid.nullable(),
    title: optionalText(200),
    body: optionalText(20000),
    method: z
      .enum(METHOD_VALUES)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : null)),
    response_received: z.boolean(),
    due_date: optionalDate,
    due_time: optionalTime,
  })
  .superRefine((a, ctx) => {
    if (!a.job_id && !a.contact_id) {
      ctx.addIssue({ code: "custom", message: "Link this to a job or a recruiter", path: ["job_id"] });
    }
    if ((a.type === "follow_up" || a.type === "interview") && !a.due_date) {
      ctx.addIssue({ code: "custom", message: "Pick a date", path: ["due_date"] });
    }
    if (a.type === "note" && !a.body) {
      ctx.addIssue({ code: "custom", message: "Write something first", path: ["body"] });
    }
  });

export const templateSchema = z.object({
  name: requiredText("Name", 120),
  body: requiredText("Message", 5000),
});

/** FormData → plain object of strings (checkboxes become "on"). */
export function formToObject(formData: FormData) {
  const obj: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) obj[k] = v;
  }
  return obj;
}
