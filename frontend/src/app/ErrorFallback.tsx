import type { FallbackProps } from "react-error-boundary";

/**
 * Fallback UI rendered by the root <ErrorBoundary> when a render error
 * crashes the React tree. Instead of a blank white screen the user sees a
 * friendly message, the underlying error text, and a "Riprova" button that
 * resets the boundary so React retries the failed render.
 *
 * Props follow react-error-boundary v6 `FallbackProps`:
 * - `error`: the thrown value
 * - `resetErrorBoundary`: clears the error and re-renders the children
 */
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // `error` is typed `unknown` by the lib: normalize to a string so we never
  // render `[object Object]` or crash on a non-Error throw.
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Errore sconosciuto";

  return (
    <div
      role="alert"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--layout-stack)",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <div className="auth-card">
        <h1 className="panel-title">Qualcosa è andato storto</h1>
        <p style={{ color: "var(--muted)" }}>
          Si è verificato un errore imprevisto. Puoi riprovare; se il problema
          persiste, ricarica la pagina.
        </p>

        <pre
          style={{
            marginTop: "var(--layout-block)",
            maxHeight: "10rem",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            padding: "var(--layout-stack)",
            borderRadius: "var(--radius-md)",
            background: "var(--card-strong)",
            color: "var(--danger)",
            fontSize: "12px",
          }}
        >
          {message}
        </pre>

        <button
          type="button"
          onClick={resetErrorBoundary}
          className="btn btn-primary"
          style={{ marginTop: "var(--layout-block)", width: "100%" }}
        >
          Riprova
        </button>
      </div>
    </div>
  );
}
