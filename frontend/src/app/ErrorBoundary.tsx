import type { ReactNode } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

function logError(error: unknown, info: { componentStack?: string | null }, context: string) {
  console.error(`[error-boundary:${context}]`, error, info.componentStack ?? "");
}

function RootFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <main className="screen auth-screen">
      <section className="auth-card stack" role="alert">
        <h1>Something went wrong</h1>
        <p className="hint">
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
    <div className="empty-state" role="alert">
      <p className="empty-state-title">This section ran into a problem</p>
      <p className="empty-state-copy">
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
