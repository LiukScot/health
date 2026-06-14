import { useEffect, useState } from "react";
import type { InlineMessage } from "./core";
import { THEMES } from "./core";
import type { useAuth } from "../hooks/use-auth";
import { useTheme } from "../hooks/use-theme";
import { getErrorMessage } from "../lib";
import { InlineFeedback, SectionHead } from "./shared";
import { McpAccessSection } from "./McpAccessSection";
import { MedicinePreselectionSection } from "./MedicinePreselectionSection";
import { DateInput } from "../components/ui/DateInput";
import { Button, buttonClass } from "../components/ui/Button";
import { FieldLine } from "../components/ui/FieldLine";
import { TAG_TAB_BTN } from "./entries";

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
    <div className="grid gap-stack">
      <SectionHead title="Birthday" ruled />
      <label className="grid gap-inline content-start">
        <DateInput value={value} onChange={handleChange} ariaLabel="Birthday" />
      </label>
      <p className="text-muted text-control">Why: this becomes a locked birthday item in Memorable days.{birthdayPending ? " Saving…" : ""}</p>
    </div>
  );
}

function ThemeBlock() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid gap-stack">
      <SectionHead title="Theme" ruled />
      <div className="flex flex-wrap gap-block" role="group" aria-label="Theme">
        {THEMES.map((t) => {
          const selected = t.id === theme;
          const dotShadow = selected
            ? "shadow-[0_0_0_2px_var(--accent)]"
            : "shadow-[var(--shadow-sm)] group-hover/sw:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_40%,transparent)]";
          return (
            <button
              key={t.id}
              type="button"
              className="group/sw flex p-0 min-h-0 bg-transparent border-0 rounded-none shadow-none cursor-pointer"
              aria-pressed={selected}
              aria-label={t.label}
              title={t.label}
              onClick={() => setTheme(t.id)}
            >
              <span className={`w-[44px] h-[44px] rounded-full border border-border grid place-items-center transition-[box-shadow] duration-150 ease-[ease] ${dotShadow}`} style={{ background: t.bg }}>
                {selected ? (
                  <svg
                    className="text-text w-[18px] h-[18px]"
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
    <div className="flex flex-col gap-inline">
      <form
        className="grid gap-stack"
        onFocus={auth.clearPasswordStatus}
        onSubmit={auth.changePasswordForm.handleSubmit((v) => auth.changePasswordMutation.mutate(v))}
      >
        <FieldLine label="Current password" type="password" autoComplete="current-password" {...auth.changePasswordForm.register("currentPassword")} />
        <FieldLine label="New password" type="password" autoComplete="new-password" {...auth.changePasswordForm.register("newPassword")} />
        <FieldLine label="Confirm" type="password" autoComplete="new-password" {...auth.changePasswordForm.register("confirmPassword")} />
        <div className="flex justify-end pt-inline">
          <Button type="submit" variant="primary" className="mt-[12px]" disabled={auth.changePasswordMutation.isPending}>
            Change password
          </Button>
        </div>
        <InlineFeedback
          message={
            auth.changePasswordMutation.error
              ? { tone: "error", text: getErrorMessage(auth.changePasswordMutation.error) }
              : auth.passwordFeedback
          }
        />
      </form>
      <div className="flex justify-end pt-inline">
        <Button type="button" onClick={() => auth.logoutMutation.mutate()} disabled={auth.logoutMutation.isPending}>
          Log out
        </Button>
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-inline">
      <div className="flex items-center justify-between gap-block px-[14px] py-[12px] rounded-md bg-card-strong max-[640px]:flex-col max-[640px]:items-stretch">
        <div className="flex flex-col gap-[2px] min-w-0">
          <span className="text-sm font-bold text-text">JSON</span>
          <span className="text-xs text-muted">Full database</span>
        </div>
        <div className="flex gap-inline flex-shrink-0 max-[640px]:justify-end">
          <Button type="button" size="sm" onClick={onExportJson}>Export</Button>
          <label className={`${buttonClass("default", "sm")} relative overflow-hidden cursor-pointer`}>
            Import
            <input
              type="file"
              accept=".json"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportJson(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
      <div className="flex items-center justify-between gap-block px-[14px] py-[12px] rounded-md bg-card-strong max-[640px]:flex-col max-[640px]:items-stretch">
        <div className="flex flex-col gap-[2px] min-w-0">
          <span className="text-sm font-bold text-text">XLSX</span>
          <span className="text-xs text-muted">Spreadsheet</span>
        </div>
        <div className="flex gap-inline flex-shrink-0 max-[640px]:justify-end">
          <Button type="button" size="sm" onClick={onExportXlsx}>Export</Button>
          <label className={`${buttonClass("default", "sm")} relative overflow-hidden cursor-pointer`}>
            Import
            <input
              type="file"
              accept=".xlsx,.xls"
              className="absolute inset-0 opacity-0 cursor-pointer"
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
    <div className="flex flex-col gap-stack">
      <p className="m-0 px-stack py-inline bg-[color-mix(in_srgb,var(--danger)_7%,var(--card))] border-l-2 border-[color-mix(in_srgb,var(--danger)_55%,transparent)] rounded-sm text-muted text-hint leading-[1.45]">
        Permanently deletes all diary entries, pain logs, CBT/DBT records, and stored preferences for this account. This cannot be undone.
      </p>
      {purgeConfirmArmed ? (
        <div className="mt-stack p-stack border border-[color-mix(in_srgb,var(--danger)_40%,var(--border))] rounded-[12px] bg-[color-mix(in_srgb,var(--danger)_8%,var(--card))] grid gap-stack" role="group" aria-label="Confirm purge all data">
          <InlineFeedback
            message={{
              tone: "warning",
              text: "This permanently deletes all diary, pain, and preference data for this account.",
            }}
          />
          <div className="flex gap-stack items-center flex-wrap [grid-column:1/-1]">
            <Button type="button" variant="danger" onClick={onPurgeConfirm} disabled={purgePending}>
              {purgePending ? "Purging..." : "Confirm purge all data"}
            </Button>
            <Button type="button" onClick={onPurgeCancel} disabled={purgePending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end pt-inline">
          <Button type="button" variant="danger" onClick={onPurgeArm}>
            Purge all data
          </Button>
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
    <div className="flex items-center gap-stack p-stack bg-card border border-[var(--border-soft)] rounded-sm">
      <div className="w-[36px] h-[36px] rounded-full grid place-items-center text-sm font-bold font-body text-accent bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)]" aria-hidden="true">
        {(name || email).slice(0, 1).toUpperCase()}
      </div>
      <div className="flex flex-col gap-[2px] min-w-0">
        <div className="text-sm font-semibold font-body text-text overflow-hidden text-ellipsis whitespace-nowrap">{name || email.split("@")[0]}</div>
        <div className="text-xs text-muted tabular-nums">{email}</div>
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

export function SettingsPanel(props: SettingsSectionProps) {
  const [tab, setTab] = useState<SettingsTab>("account");
  return (
    <div className="flex flex-col gap-block">
      <AccountIdentity auth={props.auth} />
      <nav className="flex flex-wrap gap-y-tight gap-x-block mb-[-10px] pb-inline" aria-label="Settings sections">
        {settingsTabs.map((t) => {
          const isActive = tab === t.id;
          const color = t.danger ? "text-danger" : isActive ? "text-text" : "text-muted hover:text-text";
          const border = isActive ? (t.danger ? "border-b-danger" : "border-b-accent") : "border-b-transparent";
          return (
            <button
              key={t.id}
              type="button"
              className={`${TAG_TAB_BTN} ${color} ${border}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
      <div className="pt-[4px] flex flex-col gap-stack">
        {tab === "account" ? <AccountBlock auth={props.auth} /> : null}
        {tab === "preferences" ? (
          <div className="grid gap-stack">
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
