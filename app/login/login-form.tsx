"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, {});
  return (
    <form action={action} className="grid gap-4">
      <FormError message={state.error} />
      <Field label="Username" htmlFor="username">
        <Input id="username" name="username" autoComplete="username" autoCapitalize="none" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton size="lg" className="w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
