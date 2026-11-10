"use server";

import { redirect } from "next/navigation";
import { checkCredentials, createSession, deleteSession } from "@/lib/session";
import type { FormState } from "@/lib/types";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Enter your username and password." };

  // Small fixed delay makes password guessing slower.
  await new Promise((r) => setTimeout(r, 400));
  if (!checkCredentials(username, password)) return { error: "Wrong username or password." };

  await createSession(username);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
