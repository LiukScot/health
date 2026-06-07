import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RootErrorBoundary, SectionErrorBoundary } from "./ErrorBoundary";

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("kaboom");
  }
  return <p>recovered content</p>;
}

describe("<RootErrorBoundary />", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders children when they do not throw", () => {
    render(
      <RootErrorBoundary>
        <p>healthy app</p>
      </RootErrorBoundary>,
    );
    expect(screen.getByText("healthy app")).toBeInTheDocument();
  });

  test("renders fallback with Reload + Try again when a child throws", () => {
    render(
      <RootErrorBoundary>
        <Boom shouldThrow />
      </RootErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reload/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Try again/i })).toBeInTheDocument();
  });

  test("logs the error with context (no silent catch)", () => {
    const spy = vi.spyOn(console, "error");
    render(
      <RootErrorBoundary>
        <Boom shouldThrow />
      </RootErrorBoundary>,
    );
    const loggedRootError = spy.mock.calls.some(
      (call) => typeof call[0] === "string" && call[0].includes("[error-boundary:root]"),
    );
    expect(loggedRootError).toBe(true);
  });
});

describe("<SectionErrorBoundary />", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("isolates a section crash and recovers via Try again", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [crash, setCrash] = useState(true);
      return (
        <div>
          <p>sidebar stays mounted</p>
          <SectionErrorBoundary resetKey="dashboard">
            <Boom shouldThrow={crash} />
          </SectionErrorBoundary>
          <button type="button" onClick={() => setCrash(false)}>
            fix it
          </button>
        </div>
      );
    }

    render(<Harness />);

    expect(screen.getByText("sidebar stays mounted")).toBeInTheDocument();
    expect(screen.getByText(/This section ran into a problem/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /fix it/i }));
    await user.click(screen.getByRole("button", { name: /Try again/i }));

    expect(screen.getByText("recovered content")).toBeInTheDocument();
    expect(screen.queryByText(/This section ran into a problem/i)).not.toBeInTheDocument();
  });

  test("auto-resets when resetKey changes (navigating to another section)", () => {
    const { rerender } = render(
      <SectionErrorBoundary resetKey="dashboard">
        <Boom shouldThrow />
      </SectionErrorBoundary>,
    );
    expect(screen.getByText(/This section ran into a problem/i)).toBeInTheDocument();

    rerender(
      <SectionErrorBoundary resetKey="diary">
        <Boom shouldThrow={false} />
      </SectionErrorBoundary>,
    );
    expect(screen.getByText("recovered content")).toBeInTheDocument();
  });
});
