/**
 * Verifies that the sha256 hash hardcoded in backend/src/app.ts (CSP header)
 * matches the actual inline anti-FOUC script in frontend/index.html.
 *
 * Run: bun scripts/check-csp-hash.ts
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const html = readFileSync(resolve(root, "frontend/index.html"), "utf8");
const appTs = readFileSync(resolve(root, "backend/src/app.ts"), "utf8");

// Extract inline script content — capture everything between the tags,
// including the leading newline and trailing whitespace, because that is
// exactly what the browser hashes when enforcing CSP (it does not strip
// surrounding whitespace before computing the digest).
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error("ERROR: no inline <script> block found in frontend/index.html");
  process.exit(1);
}
const scriptContent = scriptMatch[1];

// Compute sha256 base64
const hash = createHash("sha256").update(scriptContent).digest("base64");

// Extract expected hash from backend/src/app.ts
const cspMatch = appTs.match(/'sha256-([^']+)'/);
if (!cspMatch) {
  console.error("ERROR: no sha256- hash found in backend/src/app.ts CSP header");
  process.exit(1);
}
const expected = cspMatch[1];

if (hash !== expected) {
  console.error(`CSP hash mismatch!`);
  console.error(`  frontend/index.html script hash: sha256-${hash}`);
  console.error(`  backend/src/app.ts CSP hash:     sha256-${expected}`);
  console.error(`  Update the CSP hash in backend/src/app.ts to: sha256-${hash}`);
  process.exit(1);
}

console.log(`CSP hash OK: sha256-${hash}`);
