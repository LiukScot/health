import type { UseFormReturn } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";

const LOGIN_LABEL = "grid gap-1 content-start text-muted text-control";
const LOGIN_INPUT =
  "w-full max-w-full p-3 bg-card-strong text-text border border-border rounded-sm outline-none text-base shadow-[var(--shadow-sm)] transition-[border-color,background] duration-200 ease-[ease] focus:border-accent focus:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_2px_var(--ring),var(--shadow-sm)]";

type LoginScreenProps = {
  loginForm: UseFormReturn<{ email: string; password: string }>;
  loginMutation: UseMutationResult<unknown, Error, { email: string; password: string }>;
};

export function LoginScreen({ loginForm, loginMutation }: LoginScreenProps) {
  return (
    <main className="grid place-items-center min-h-screen p-0 max-mobile:p-3">
      <section className="w-[min(560px,94vw)] bg-card border border-border rounded-lg p-3 shadow-[var(--shadow)]">
        <h1>World</h1>
        <p>Sign in to access your private workspace.</p>
        <form noValidate onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))} className="grid gap-3">
          <label className={LOGIN_LABEL}>
            Email
            <input
              type="email"
              className={LOGIN_INPUT}
              autoComplete="username"
              aria-invalid={!!loginForm.formState.errors.email}
              aria-describedby={loginForm.formState.errors.email ? "login-email-error" : undefined}
              {...loginForm.register("email")}
            />
            {loginForm.formState.errors.email && (
              <p id="login-email-error" className="text-danger m-0" role="alert">{loginForm.formState.errors.email.message}</p>
            )}
          </label>
          <label className={LOGIN_LABEL}>
            Password
            <input
              type="password"
              className={LOGIN_INPUT}
              autoComplete="current-password"
              aria-invalid={!!loginForm.formState.errors.password}
              aria-describedby={loginForm.formState.errors.password ? "login-password-error" : undefined}
              {...loginForm.register("password")}
            />
            {loginForm.formState.errors.password && (
              <p id="login-password-error" className="text-danger m-0" role="alert">{loginForm.formState.errors.password.message}</p>
            )}
          </label>
          <Button type="submit" variant="primary" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
          {loginMutation.error && <p className="text-danger m-0">{String(loginMutation.error.message)}</p>}
          <p className="text-muted text-control">Signup is disabled. Use CLI provisioning.</p>
        </form>
      </section>
    </main>
  );
}
