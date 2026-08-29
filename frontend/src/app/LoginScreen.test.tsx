import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginScreen } from "./LoginScreen";
import { loginSchema, registerSchema, type Realm } from "./core";
import type { UseMutationResult } from "@tanstack/react-query";

type LoginValues = { email: string; password: string };

// reason: react-query mutation surface is huge; only a few fields are read by LoginScreen
// so we cast through unknown from a partial mock.
function makeMutation(overrides: Record<string, unknown> = {}) {
  const mutate = vi.fn();
  const base = {
    mutate,
    isPending: false,
    error: null,
    ...overrides,
  };
  return base as unknown as UseMutationResult<unknown, Error, LoginValues>;
}

function Wrapper({
  onSubmit,
  onRegister,
  isPending = false,
  error = null,
  onRealmChange = () => {},
}: {
  onSubmit?: (v: LoginValues) => void;
  onRegister?: (v: LoginValues) => void;
  isPending?: boolean;
  error?: Error | null;
  onRealmChange?: (next: Realm) => void;
}) {
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const mutation = makeMutation({
    isPending,
    error,
    mutate: ((values: LoginValues) => onSubmit?.(values)) as never,
  });
  const signupForm = useForm<LoginValues>({ resolver: zodResolver(registerSchema) });
  const signupMutation = makeMutation({
    mutate: ((values: LoginValues) => onRegister?.(values)) as never,
  });
  return (
    <LoginScreen
      loginForm={form}
      loginMutation={mutation}
      registerForm={signupForm}
      registerMutation={signupMutation}
      realm="health"
      onRealmChange={onRealmChange}
    />
  );
}

describe("<LoginScreen />", () => {
  test("renders email + password fields and submit button", () => {
    render(<Wrapper />);
    expect(screen.getByText("World")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign in/i })).toBeInTheDocument();
  });

  test("disables submit and shows pending label while mutation is pending", () => {
    render(<Wrapper isPending />);
    const btn = screen.getByRole("button", { name: /Signing in.../i });
    expect(btn).toBeDisabled();
  });

  test("surfaces validation error when email is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Wrapper onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/Password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  test("submits values when both fields are filled", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Wrapper onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/Email/i), "user@example.com");
    await user.type(screen.getByLabelText(/Password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /Sign in/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "Password123!",
    });
  });

  test("displays mutation error message", () => {
    render(<Wrapper error={new Error("Invalid credentials")} />);
    expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
  });

  test("offers a way to create an account", () => {
    render(<Wrapper />);
    expect(screen.getByRole("button", { name: /No account yet/i })).toBeInTheDocument();
  });
});

describe("<LoginScreen /> realm switcher", () => {
  test("offers somewhere to land, but not Settings", () => {
    render(<Wrapper />);
    expect(screen.getByRole("button", { name: "Health" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Money" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
  });

  test("reports the picked realm without submitting the form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onRealmChange = vi.fn();
    render(<Wrapper onSubmit={onSubmit} onRealmChange={onRealmChange} />);

    await user.click(screen.getByRole("button", { name: "Money" }));

    expect(onRealmChange).toHaveBeenCalledWith("money");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("<LoginScreen /> create account", () => {
  test("switches to the register form and back", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    expect(screen.getByRole("button", { name: /^Sign in$/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /No account yet/i }));
    expect(screen.getByRole("button", { name: /Create account/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Sign in$/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Already have an account/i }));
    expect(screen.getByRole("button", { name: /^Sign in$/i })).toBeInTheDocument();
  });

  test("registers through the register mutation, not the login one", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onRegister = vi.fn();
    render(<Wrapper onSubmit={onSubmit} onRegister={onRegister} />);

    await user.click(screen.getByRole("button", { name: /No account yet/i }));
    await user.type(screen.getByLabelText(/Email/i), "new@example.com");
    await user.type(screen.getByLabelText(/Password/i), "Password123");
    await user.click(screen.getByRole("button", { name: /Create account/i }));

    expect(onRegister).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("holds a short password at the form instead of posting it", async () => {
    const user = userEvent.setup();
    const onRegister = vi.fn();
    render(<Wrapper onRegister={onRegister} />);

    await user.click(screen.getByRole("button", { name: /No account yet/i }));
    await user.type(screen.getByLabelText(/Email/i), "new@example.com");
    await user.type(screen.getByLabelText(/Password/i), "short");
    await user.click(screen.getByRole("button", { name: /Create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/At least 8 characters/i);
    expect(onRegister).not.toHaveBeenCalled();
  });

  test("does not carry what you typed across the switch", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.type(screen.getByLabelText(/Email/i), "typed@example.com");

    await user.click(screen.getByRole("button", { name: /No account yet/i }));

    expect(screen.getByLabelText(/Email/i)).toHaveValue("");
  });
});
