import { describe, expect, test, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./ErrorFallback";

function noop() {}

describe("<ErrorFallback />", () => {
  test("renders heading and normalized message for an Error instance", () => {
    render(
      <ErrorFallback error={new Error("boom")} resetErrorBoundary={noop} />,
    );

    expect(screen.getByText("Qualcosa è andato storto")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  test("the container exposes role=alert", () => {
    render(
      <ErrorFallback error={new Error("boom")} resetErrorBoundary={noop} />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  test("renders a raw string error as the message", () => {
    render(
      <ErrorFallback error="plain string failure" resetErrorBoundary={noop} />,
    );

    expect(screen.getByText("plain string failure")).toBeInTheDocument();
  });

  test("falls back to 'Errore sconosciuto' for a non-Error, non-string value", () => {
    render(<ErrorFallback error={{}} resetErrorBoundary={noop} />);

    expect(screen.getByText("Errore sconosciuto")).toBeInTheDocument();
  });

  test("clicking 'Riprova' calls resetErrorBoundary once", async () => {
    const user = userEvent.setup();
    const resetErrorBoundary = vi.fn();
    render(
      <ErrorFallback error={new Error("boom")} resetErrorBoundary={resetErrorBoundary} />,
    );

    await user.click(screen.getByRole("button", { name: "Riprova" }));

    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });
});

describe("<ErrorBoundary> integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function Bomb(): never {
    throw new Error("render exploded");
  }

  test("renders ErrorFallback when a child throws during render", () => {
    // reason: React logs the caught render error to console.error; suppress the
    // expected noise so the test output stays clean.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Qualcosa è andato storto")).toBeInTheDocument();
    expect(screen.getByText("render exploded")).toBeInTheDocument();
  });
});
