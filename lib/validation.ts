import { z } from "zod";
import { parseUrl } from "@/lib/linkedin";

const requiredText = (label: string, max = 200) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max);

const httpUrl = (label: string, max = 4000) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max)
    .refine((v) => parseUrl(v) !== null, "Enter a full link starting with http:// or https://");

const optionalHttpUrl = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || parseUrl(v) !== null, "Enter a full link starting with http:// or https://");

export const uuid = z.uuid();

export const boardSchema = z.object({
  name: requiredText("Name", 80),
  home_url: optionalHttpUrl,
});

export const searchSchema = z.object({
  board_id: uuid,
  name: requiredText("Name", 120),
  url: httpUrl("Link"),
});

export const templateSchema = z.object({
  name: requiredText("Name", 120),
  body: requiredText("Message", 5000),
});

/** FormData → plain object of strings. */
export function formToObject(formData: FormData) {
  const obj: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) obj[k] = v;
  }
  return obj;
}
