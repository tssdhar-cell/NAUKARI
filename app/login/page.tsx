import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
            N
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your job tracker</p>
        </div>
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
