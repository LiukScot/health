import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "sonner";
import App from "./App";
import { ErrorFallback } from "./app/ErrorFallback";
import "./styles.css";

document.body.classList.add("mh-app");

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error("Render error caught by root boundary:", error);
        console.error("Component stack:", info.componentStack);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
    <Toaster theme="dark" richColors position="bottom-right" closeButton />
  </StrictMode>
);
