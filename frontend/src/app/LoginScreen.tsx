import { useState } from "react";
import type { UseFormRegisterReturn, UseFormReturn } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { RealmSwitcher } from "./Sidebar";
import { type Realm } from "./core";
import { TITLE_TYPE } from "./screen-helpers";

// Settings is not a landing place — you go there to change something.
const LOGIN_REALMS = ["health", "money"] as const satisfies readonly Realm[];

const LOGIN_LABEL = "grid gap-2 content-start text-muted text-control";
const LOGIN_INPUT =
  "w-full max-w-full p-3 bg-card-strong text-text border border-border rounded-sm outline-none text-base shadow-[var(--shadow-sm)] transition-[border-color,background] duration-200 ease-[ease] focus:border-accent focus:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_2px_var(--ring),var(--shadow-sm)]";
const MODE_LINK =
  "justify-self-start p-0 bg-transparent border-0 shadow-none text-accent text-control font-semibold underline underline-offset-2 cursor-pointer hover:no-underline";

type Credentials = { email: string; password: string };
type CredentialsMutation = UseMutationResult<unknown, Error, Credentials>;

/*
 * Sign in and create account are the same two fields, so they are the same
 * markup — only the ids, the autocomplete tokens and which form owns them
 * change. Two copies would be two places to forget an aria attribute.
 */
function CredentialField({
  id,
  label,
  type,
  autoComplete,
  error,
  ...field
}: {
  id: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  error?: string;
} & UseFormRegisterReturn) {
  return (
    <label className={LOGIN_LABEL} htmlFor={id}>
      {label}
      <input
        id={id}
        type={type}
        className={LOGIN_INPUT}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...field}
      />
      {error && (
        <p id={`${id}-error`} className="text-danger m-0" role="alert">{error}</p>
      )}
    </label>
  );
}

type LoginScreenProps = {
  loginForm: UseFormReturn<Credentials>;
  loginMutation: CredentialsMutation;
  registerForm: UseFormReturn<Credentials>;
  registerMutation: CredentialsMutation;
  realm: Realm;
  onRealmChange: (next: Realm) => void;
};

export function LoginScreen({
  loginForm,
  loginMutation,
  registerForm,
  registerMutation,
  realm,
  onRealmChange,
}: LoginScreenProps) {
  const [creating, setCreating] = useState(false);
  const form = creating ? registerForm : loginForm;
  const mutation = creating ? registerMutation : loginMutation;
  const prefix = creating ? "register" : "login";
  const errors = form.formState.errors;

  return (
    <main className="grid place-items-center min-h-screen p-0 max-mobile:p-3">
      {/*
        * One grid, one distance between blocks — the card used to space its
        * parts with a margin here and a padding there, which landed every
        * gap on the same 12px: the space inside a field read the same as the
        * space between the form and the footer, so nothing grouped. Now 8px
        * binds a label to its control, 4px binds the title to its line, and
        * 20px separates the blocks those make up.
        */}
      <section className="w-[min(560px,94vw)] grid gap-5 bg-card border border-border rounded-lg p-5 shadow-[var(--shadow)]">
        <div className="grid gap-1">
          <h1 className={TITLE_TYPE}>World</h1>
          {/* Same size and tone as every other description under a title (see
              EmptyState): it is the line that explains the screen, not one of
              the screen's own words. */}
          <p className="m-0 text-control text-muted leading-normal">
            {creating ? "Create an account to get your private workspace." : "Sign in to access your private workspace."}
          </p>
        </div>
        <form
          noValidate
          // Keyed so switching mode remounts the fields: React would
          // otherwise reuse the same inputs and carry what you typed on one
          // form into the other, along with its stale validation errors.
          key={prefix}
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-5"
        >
          <CredentialField
            id={`${prefix}-email`}
            label="Email"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...form.register("email")}
          />
          <CredentialField
            id={`${prefix}-password`}
            label="Password"
            type="password"
            autoComplete={creating ? "new-password" : "current-password"}
            error={errors.password?.message}
            {...form.register("password")}
          />
          {/* The failure belongs to the button that caused it, so it sits
              closer to it than the fields sit to each other. */}
          <div className="grid gap-2">
            <Button type="submit" variant="primary" disabled={mutation.isPending}>
              {mutation.isPending
                ? creating ? "Creating account..." : "Signing in..."
                : creating ? "Create account" : "Sign in"}
            </Button>
            {mutation.error && <p className="text-danger m-0 text-control">{String(mutation.error.message)}</p>}
          </div>
        </form>

        <button type="button" className={MODE_LINK} onClick={() => setCreating((c) => !c)}>
          {creating ? "Already have an account? Sign in" : "No account yet? Create one"}
        </button>

        {/* Outside the form: choosing where to land is not a credential, and
            a button inside a form is a submit button waiting to happen. */}
        <RealmSwitcher
          realm={realm}
          onChange={onRealmChange}
          options={LOGIN_REALMS}
          className="justify-center pt-5 border-t border-border"
        />
      </section>
    </main>
  );
}
