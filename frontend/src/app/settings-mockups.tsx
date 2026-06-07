import { useEffect, useState } from "react";
import type { InlineMessage } from "./core";
import { THEMES } from "./core";
import type { useAuth } from "../hooks/use-auth";
import { useTheme } from "../hooks/use-theme";
import { getErrorMessage } from "../lib";
import { InlineFeedback, SectionHead } from "./shared";
import { McpAccessSection } from "./McpAccessSection";
import { MedicinePreselectionSection } from "./MedicinePreselectionSection";
import { DateField } from "./DateField";

type SettingsSectionProps = {
  auth: ReturnType<typeof useAuth>;
  birthday: string | null;
  birthdayPending: boolean;
  onSaveBirthday: (birthday: string | null) => void;
  purgeConfirmArmed: boolean;
  purgePending: boolean;
  purgeError: InlineMessage | null;
  onPurgeArm: () => void;
  onPurgeConfirm: () => void;
  onPurgeCancel: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onExportXlsx: () => void;
  onImportXlsx: (file: File) => void;
};

function BirthdayBlock({
  birthday,
  birthdayPending,
  onSaveBirthday,
}: Pick<SettingsSectionProps, "birthday" | "birthdayPending" | "onSaveBirthday">) {
  const [value, setValue] = useState(birthday ?? "");

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setValue(birthday ?? ""); }, [birthday]);

  const handleChange = (next: string) => {
    setValue(next);
    onSaveBirthday(next || null);
  };

  return (
    <div className="stack">
      <SectionHead title="Birthday" ruled />
      <label className="field field-line">
        <DateField value={value} onChange={handleChange} ariaLabel="Birthday" placeholder="Select birthday" />
      </label>
      <p className="hint">Why: this becomes a locked birthday item in Memorable days.{birthdayPending ? " Saving…" : ""}</p>
    </div>
  );
}

function ThemeBlock() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="stack">
      <SectionHead title="Theme" ruled />
      <div className="theme-swatches" role="group" aria-label="Theme">
        {THEMES.map((t) => {
          const selected = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              className={`theme-swatch${selected ? " is-selected" : ""}`}
              aria-pressed={selected}
              aria-label={t.label}
              title={t.label}
              onClick={() => setTheme(t.id)}
            >
              <span className="theme-swatch-dot" style={{ background: t.bg }}>
                {selected ? (
                  <svg
                    className="theme-swatch-check"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AccountBlock({ auth }: Pick<SettingsSectionProps, "auth">) {
  return (
    <div className="settings-account-block">
      <form
        className="stack"
        onFocus={auth.clearPasswordStatus}
        onSubmit={auth.changePasswordForm.handleSubmit((v) => auth.changePasswordMutation.mutate(v))}
      >
        <label className="field field-line">
          <span className="field-line-label">Current password</span>
          <input type="password" autoComplete="current-password" {...auth.changePasswordForm.register("currentPassword")} />
        </label>
        <label className="field field-line">
          <span className="field-line-label">New password</span>
          <input type="password" autoComplete="new-password" {...auth.changePasswordForm.register("newPassword")} />
        </label>
        <label className="field field-line">
          <span className="field-line-label">Confirm</span>
          <input type="password" autoComplete="new-password" {...auth.changePasswordForm.register("confirmPassword")} />
        </label>
        <div className="save-section">
          <button type="submit" className="btn btn-primary" disabled={auth.changePasswordMutation.isPending}>
            Change password
          </button>
        </div>
        <InlineFeedback
          message={
            auth.changePasswordMutation.error
              ? { tone: "error", text: getErrorMessage(auth.changePasswordMutation.error) }
              : auth.passwordFeedback
          }
        />
      </form>
      <div className="save-section">
        <button type="button" className="btn" onClick={() => auth.logoutMutation.mutate()} disabled={auth.logoutMutation.isPending}>
          Log out
        </button>
      </div>
    </div>
  );
}

function BackupBlock({
  onExportJson,
  onImportJson,
  onExportXlsx,
  onImportXlsx,
}: Pick<SettingsSectionProps, "onExportJson" | "onImportJson" | "onExportXlsx" | "onImportXlsx">) {
  return (
    <div className="settings-backup">
      <div className="backup-row">
        <div className="backup-row-head">
          <span className="backup-row-title">JSON</span>
          <span className="backup-row-meta">Full database</span>
        </div>
        <div className="backup-row-actions">
          <button type="button" className="btn" onClick={onExportJson}>Export</button>
          <label className="btn file-input-btn">
            Import
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportJson(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
      <div className="backup-row">
        <div className="backup-row-head">
          <span className="backup-row-title">XLSX</span>
          <span className="backup-row-meta">Spreadsheet</span>
        </div>
        <div className="backup-row-actions">
          <button type="button" className="btn" onClick={onExportXlsx}>Export</button>
          <label className="btn file-input-btn">
            Import
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportXlsx(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function DangerBlock({
  purgeConfirmArmed,
  purgePending,
  purgeError,
  onPurgeArm,
  onPurgeConfirm,
  onPurgeCancel,
}: Pick<SettingsSectionProps, "purgeConfirmArmed" | "purgePending" | "purgeError" | "onPurgeArm" | "onPurgeConfirm" | "onPurgeCancel">) {
  return (
    <div className="settings-danger-block">
      <p className="settings-danger-description">
        Permanently deletes all diary entries, pain logs, CBT/DBT records, and stored preferences for this account. This cannot be undone.
      </p>
      {purgeConfirmArmed ? (
        <div className="inline-confirmation" role="group" aria-label="Confirm purge all data">
          <InlineFeedback
            className="confirmation-copy"
            message={{
              tone: "warning",
              text: "This permanently deletes all diary, pain, and preference data for this account.",
            }}
          />
          <div className="row-actions confirmation-actions">
            <button type="button" className="btn btn-danger" onClick={onPurgeConfirm} disabled={purgePending}>
              {purgePending ? "Purging..." : "Confirm purge all data"}
            </button>
            <button type="button" className="btn" onClick={onPurgeCancel} disabled={purgePending}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="save-section">
          <button type="button" className="btn btn-danger" onClick={onPurgeArm}>
            Purge all data
          </button>
        </div>
      )}
      <InlineFeedback message={purgeError} />
    </div>
  );
}

function AccountIdentity({ auth }: Pick<SettingsSectionProps, "auth">) {
  const email = auth.user?.email ?? "—";
  const name = auth.user?.name?.trim();
  return (
    <div className="settings-identity">
      <div className="settings-identity-avatar" aria-hidden="true">
        {(name || email).slice(0, 1).toUpperCase()}
      </div>
      <div className="settings-identity-meta">
        <div className="settings-identity-name">{name || email.split("@")[0]}</div>
        <div className="settings-identity-email">{email}</div>
      </div>
    </div>
  );
}

/* ── Variant B — Sub-tabs ── */
type SettingsTab = "account" | "preferences" | "backup" | "mcp" | "danger";
const settingsTabs: { id: SettingsTab; label: string; danger?: boolean }[] = [
  { id: "account", label: "Account" },
  { id: "preferences", label: "Preferences" },
  { id: "backup", label: "Backup" },
  { id: "mcp", label: "MCP access" },
  { id: "danger", label: "Danger zone", danger: true },
];

export function SettingsVariantB(props: SettingsSectionProps) {
  const [tab, setTab] = useState<SettingsTab>("account");
  return (
    <div className="settings-mock settings-mock-b">
      <AccountIdentity auth={props.auth} />
      <nav className="tag-tabs settings-mock-tabs" aria-label="Settings sections">
        {settingsTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${tab === t.id ? "active" : ""}${t.danger ? " settings-mock-tab--danger" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="settings-mock-panel">
        {tab === "account" ? <AccountBlock auth={props.auth} /> : null}
        {tab === "preferences" ? (
          <div className="stack">
            <ThemeBlock />
            <BirthdayBlock
              birthday={props.birthday}
              birthdayPending={props.birthdayPending}
              onSaveBirthday={props.onSaveBirthday}
            />
            <MedicinePreselectionSection enabled />
          </div>
        ) : null}
        {tab === "backup" ? (
          <BackupBlock
            onExportJson={props.onExportJson}
            onImportJson={props.onImportJson}
            onExportXlsx={props.onExportXlsx}
            onImportXlsx={props.onImportXlsx}
          />
        ) : null}
        {tab === "mcp" ? <McpAccessSection enabled /> : null}
        {tab === "danger" ? (
          <DangerBlock
            purgeConfirmArmed={props.purgeConfirmArmed}
            purgePending={props.purgePending}
            purgeError={props.purgeError}
            onPurgeArm={props.onPurgeArm}
            onPurgeConfirm={props.onPurgeConfirm}
            onPurgeCancel={props.onPurgeCancel}
          />
        ) : null}
      </div>
    </div>
  );
}
