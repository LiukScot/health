import { useState } from "react";
import { useMcpTokens, type ExpiryChoice } from "../hooks/use-mcp-tokens";
import { InlineFeedback, SectionHead } from "./shared";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/Button";
import { FieldLine, FIELD_LINE_LABEL } from "../components/ui/FieldLine";
import { TAG_TAB_BTN } from "./entries";

const MCP_INTRO = "mt-[6px] mb-0 text-hint leading-[1.45] text-muted";
const CODE_BLOCK =
  "m-0 p-stack bg-card-soft text-text border border-[var(--border-soft)] rounded-sm font-medium text-xs font-mono leading-normal overflow-x-auto whitespace-pre";

const EXPIRY_OPTIONS: { value: ExpiryChoice; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
];

type ClientTab = "generic" | "claude-desktop" | "claude-code" | "curl";

function buildGenericInstructions(baseUrl: string, plaintext: string): string {
  return `Endpoint  ${baseUrl}/mcp
Transport HTTP (streamable)
Header    Authorization: Bearer ${plaintext}

Works with any MCP-compliant client (Cline, Continue, Cursor,
custom clients, etc.). Point your client at the endpoint above and
pass the bearer token in the Authorization header.`;
}

function buildClaudeDesktopConfig(baseUrl: string, plaintext: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        health: {
          url: `${baseUrl}/mcp`,
          headers: { Authorization: `Bearer ${plaintext}` },
        },
      },
    },
    null,
    2
  );
}

function buildClaudeCodeCommand(baseUrl: string, plaintext: string): string {
  return `claude mcp add --transport http health ${baseUrl}/mcp --header "Authorization: Bearer ${plaintext}"`;
}

function buildCurlCommand(baseUrl: string, plaintext: string): string {
  return `curl -H "Authorization: Bearer ${plaintext}" ${baseUrl}/mcp/healthz`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  return iso.slice(0, 10);
}

function formatExpiry(iso: string | null): string {
  if (!iso) return "never expires";
  return `expires ${iso.slice(0, 10)}`;
}

/**
 * MCP Access settings section. Self-contained — uses the useMcpTokens hook
 * directly so the parent SettingsSection doesn't need to thread props.
 *
 * Visuals are aligned to the app's design system: SectionHead for titles,
 * btn / btn-primary / btn-danger for actions, field-line for inputs,
 * tag-tabs for the client picker, code-block for snippets.
 */
export function McpAccessSection({ enabled }: { enabled: boolean }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const tokens = useMcpTokens(enabled);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newExpiry, setNewExpiry] = useState<ExpiryChoice>("never");
  const [activeTab, setActiveTab] = useState<ClientTab>("generic");
  const [testStatus, setTestStatus] = useState<Record<number, "idle" | "ok" | "fail">>({});

  const handleCreate = () => {
    tokens.onCreate(newLabel, newExpiry);
    setNewLabel("");
    setNewExpiry("never");
    setShowCreateForm(false);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Best-effort copy; on failure the user can still select the snippet.
    }
  };

  const handleTest = async (id: number) => {
    if (!tokens.justCreated || tokens.justCreated.id !== id) {
      // Test only works while we still have the plaintext in memory.
      return;
    }
    const ok = await tokens.testConnection(tokens.justCreated.plaintext);
    setTestStatus((prev) => ({ ...prev, [id]: ok ? "ok" : "fail" }));
  };

  return (
    <div className="flex flex-col">
      <SectionHead title="MCP access" />
      <p className={MCP_INTRO}>
        Connect any MCP-compliant AI client (Cline, Continue, Cursor, Claude Desktop, Claude Code, or your own) to your health data over HTTP.
      </p>

      {tokens.justCreated ? (
        <div className="flex flex-col gap-inline mt-[8px] p-stack bg-[color-mix(in_srgb,var(--warning)_10%,var(--card))] border border-[color-mix(in_srgb,var(--warning)_40%,var(--border))] rounded-sm">
          <InlineFeedback
            message={{
              tone: "warning",
              text: "Copy this token now — it will not be shown again after you dismiss this panel.",
            }}
          />
          <pre className={CODE_BLOCK}>{tokens.justCreated.plaintext}</pre>
          <div className="flex gap-stack items-center flex-wrap mt-stack">
            <Button type="button" variant="primary" onClick={() => handleCopy(tokens.justCreated!.plaintext)}>
              Copy token
            </Button>
            <Button type="button" onClick={() => handleTest(tokens.justCreated!.id)}>
              Test connection
            </Button>
            {testStatus[tokens.justCreated.id] === "ok" ? (
              <span className="text-xs font-semibold font-body tabular-nums text-success">✓ connected</span>
            ) : null}
            {testStatus[tokens.justCreated.id] === "fail" ? (
              <span className="text-xs font-semibold font-body tabular-nums text-danger">✗ failed</span>
            ) : null}
            <Button type="button" onClick={tokens.dismissJustCreated}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      <SectionHead title="Active tokens" />
      {tokens.isLoading ? (
        <p className="mt-[6px] text-hint text-muted-soft italic">Loading…</p>
      ) : tokens.tokens.length === 0 ? (
        <p className="mt-[6px] text-hint text-muted-soft italic">No tokens yet. Create one below to connect an AI client.</p>
      ) : (
        <ul className="list-none p-0 mt-[4px] mb-0 flex flex-col">
          {tokens.tokens.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-stack px-[2px] py-[10px] border-b border-[var(--border-soft)] last:border-b-0">
              <div className="min-w-0 flex-1 flex flex-col gap-[2px]">
                <div className="text-[13.5px] font-semibold font-body text-text overflow-hidden text-ellipsis whitespace-nowrap">{t.label || `Token #${t.id}`}</div>
                <div className="text-[11.5px] text-muted tabular-nums">
                  Created {t.createdAt.slice(0, 10)} · Last used {formatRelative(t.lastUsedAt)} · {formatExpiry(t.expiresAt)}
                </div>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => tokens.onRevoke(t.id)}
                disabled={tokens.revokePending}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}

      {showCreateForm ? (
        <div className="flex flex-col mt-[4px]">
          <SectionHead title="New token" />
          <FieldLine
            label="Label"
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Claude Desktop MacBook"
            maxLength={100}
          />
          <div className="grid gap-inline content-start">
            <span className={FIELD_LINE_LABEL}>Expiry</span>
            <Select
              ariaLabel="Expiry"
              value={newExpiry}
              onValueChange={(value) => {
                const choice = EXPIRY_OPTIONS.find((option) => option.value === value);
                if (choice) setNewExpiry(choice.value);
              }}
              options={EXPIRY_OPTIONS}
            />
          </div>
          <div className="flex justify-end gap-inline pt-[4px]">
            <Button type="button" variant="primary" onClick={handleCreate} disabled={tokens.createPending}>
              {tokens.createPending ? "Creating…" : "Create token"}
            </Button>
            <Button type="button" onClick={() => setShowCreateForm(false)} disabled={tokens.createPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end pt-inline">
          <Button type="button" onClick={() => setShowCreateForm(true)}>
            + Create new token
          </Button>
        </div>
      )}

      <InlineFeedback message={tokens.feedback} />

      <SectionHead title="How to connect" />
      <nav className="flex flex-wrap gap-y-tight gap-x-block mt-[4px]" role="tablist" aria-label="MCP client instructions">
        {(["generic", "claude-desktop", "claude-code", "curl"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`${TAG_TAB_BTN} ${activeTab === tab ? "text-text border-b-accent" : "text-muted border-b-transparent hover:text-text"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "generic" ? "Any client" : tab === "claude-desktop" ? "Claude Desktop" : tab === "claude-code" ? "Claude Code" : "Curl test"}
          </button>
        ))}
      </nav>

      <McpClientInstructions tab={activeTab} baseUrl={baseUrl} onCopy={handleCopy} />
    </div>
  );
}

function McpClientInstructions({
  tab,
  baseUrl,
  onCopy,
}: {
  tab: ClientTab;
  baseUrl: string;
  onCopy: (text: string) => void;
}) {
  // We only have the plaintext token at creation time. After that, instructions
  // show a placeholder that the user must replace with their stored token.
  const placeholder = "<your token here>";

  let snippet: string;
  let description: string;
  switch (tab) {
    case "generic":
      snippet = buildGenericInstructions(baseUrl, placeholder);
      description = "Any MCP-compliant client over HTTP: use this endpoint + bearer token. Config format varies per client.";
      break;
    case "claude-desktop":
      snippet = buildClaudeDesktopConfig(baseUrl, placeholder);
      description = "Add this block to your claude_desktop_config.json under the existing mcpServers entry.";
      break;
    case "claude-code":
      snippet = buildClaudeCodeCommand(baseUrl, placeholder);
      description = "Run this command from any terminal where Claude Code is installed.";
      break;
    case "curl":
      snippet = buildCurlCommand(baseUrl, placeholder);
      description = "Quick health check — should return JSON with ok=true.";
      break;
  }

  return (
    <div className="flex flex-col gap-inline mt-[4px]">
      <p className={MCP_INTRO}>{description}</p>
      <pre className={CODE_BLOCK}>{snippet}</pre>
      <div className="flex justify-end pt-inline">
        <Button type="button" onClick={() => onCopy(snippet)}>
          Copy
        </Button>
      </div>
    </div>
  );
}
