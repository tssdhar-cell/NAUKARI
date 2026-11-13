import "server-only";
import type { z } from "zod";
import type { FormState } from "@/lib/types";

export function validationError(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { error: "Please fix the highlighted fields.", fieldErrors };
}

export function dbError(e: unknown): FormState {
  console.error(e);
  const message = e instanceof Error ? e.message : String(e);
  return { error: `Could not save: ${message}` };
}

export function throwIf(res: { error: { message: string } | null }) {
  if (res.error) throw new Error(res.error.message);
}
