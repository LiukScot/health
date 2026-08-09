import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // A negative UTC offset, deliberately. Date-only strings parse as UTC
    // midnight, so a zone behind UTC is the only place where treating one as
    // an instant renders the wrong calendar day. Under TZ=UTC that class of
    // bug passes every test.
    env: { TZ: "America/New_York" },
  },
});
