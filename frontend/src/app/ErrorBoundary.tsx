import type { ReactNode } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

function logError(error: unknown, info: { componentStack?: string | null }, context: string) {
  console.error(`[error-boundary:${context}]`, error, info.componentStack ?? "");
}

function RootFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <main className="grid place-items-center min-h-screen p-0 max-[720px]:p-stack">
      <section className="w-[min(560px,94vw)] bg-card border border-border rounded-lg p-stack shadow-[var(--shadow)] grid gap-stack" role="alert">
        <h1>Something went wrong</h1>
        <p className="text-muted text-control">
          The app hit an unexpected error and couldn&apos;t continue. Reloading
          usually clears it.
        </p>
        <button type="button" className="active" onClick={() => window.location.reload()}>
          Reload
        </button>
        <button type="button" onClick={resetErrorBoundary}>
          Try again
        </button>
      </section>
    </main>
  );
}

function SectionFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="grid gap-inline my-stack" role="alert">
      <p className="text-control font-semibold text-text m-0">This section ran into a problem</p>
      <p className="max-w-[60ch] text-control text-muted leading-normal m-0">
        Something went wrong while loading this view. The rest of the app is
        still available.
      </p>
      <div>
        <button type="button" onClick={resetErrorBoundary}>
          Try again
        </button>
      </div>
    </div>
  );
}

export function RootErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={RootFallback}
      onError={(error, info) => logError(error, info, "root")}
    >
      {children}
    </ErrorBoundary>
  );
}

export function SectionErrorBoundary({
  children,
  resetKey,
}: {
  children: ReactNode;
  resetKey?: unknown;
}) {
  return (
    <ErrorBoundary
      FallbackComponent={SectionFallback}
      onError={(error, info) => logError(error, info, "section")}
      resetKeys={[resetKey]}
    >
      {children}
    </ErrorBoundary>
  );
}
