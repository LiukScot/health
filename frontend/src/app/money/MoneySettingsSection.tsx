import { useState } from "react";
import { Button, buttonClass } from "../../components/ui/Button";
import { Select } from "../../components/ui/select";
import { InlineFeedback, SectionHead } from "../shared";
import { EmptyState } from "../screen-helpers";
import { TAG_TAB_BTN } from "../entries";
import type { InlineMessage } from "../core";
import { RISK_LEVELS, type RiskLevel, type StylesMap } from "./core";

type MoneySettingsProps = {
  showZeroAssets: boolean;
  onToggleShowZeroAssets: (next: boolean) => void;
  styles: StylesMap;
  assets: string[];
  stylesLoading: boolean;
  onChangeStyle: (asset: string, patch: { colorHex?: string | null; riskLevel?: RiskLevel | null }) => void;
  backupMessage: InlineMessage | null;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onExportXlsx: () => void;
  onImportXlsx: (file: File) => void;
  purgeConfirmArmed: boolean;
  purgePending: boolean;
  purgeError: InlineMessage | null;
  onPurgeArm: () => void;
  onPurgeConfirm: () => void;
  onPurgeCancel: () => void;
};

type Tab = "preferences" | "assets" | "backup" | "danger";
const TABS: { id: Tab; label: string; danger?: boolean }[] = [
  { id: "preferences", label: "Preferences" },
  { id: "assets", label: "Assets" },
  { id: "backup", label: "Backup" },
  { id: "danger", label: "Danger zone", danger: true },
];

const RISK_OPTIONS = [{ value: "", label: "not set" }, ...RISK_LEVELS.map((r) => ({ value: r, label: r }))];
const DEFAULT_SWATCH = "#34d399";

const ROW = "flex items-center justify-between gap-5 px-[14px] py-[12px] rounded-md bg-card-strong max-sm:flex-col max-sm:items-stretch";

function PreferencesBlock({ showZeroAssets, onToggleShowZeroAssets }: Pick<MoneySettingsProps, "showZeroAssets" | "onToggleShowZeroAssets">) {
  return (
    <div className={ROW}>
      <div className="flex flex-col gap-[2px] min-w-0">
        <span className="text-sm font-bold text-text">Show zero-value assets</span>
        <span className="text-xs text-muted">Keep assets you have fully sold off visible in lists and charts.</span>
      </div>
      <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          name="showZeroAssets"
          className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
          checked={showZeroAssets}
          onChange={(e) => onToggleShowZeroAssets(e.target.checked)}
        />
        <span className="text-control text-muted">{showZeroAssets ? "Shown" : "Hidden"}</span>
      </label>
    </div>
  );
}

function AssetsBlock({ styles, assets, stylesLoading, onChangeStyle }: Pick<MoneySettingsProps, "styles" | "assets" | "stylesLoading" | "onChangeStyle">) {
  if (stylesLoading) return <p className="text-muted text-control">Loading assets…</p>;
  if (assets.length === 0) {
    return (
      <EmptyState
        title="No assets yet"
        description="Assets appear here once you record a transaction against them. Their risk level is what the monthly snapshots are built from."
      />
    );
  }

  return (
    <div className="grid gap-2">
      <p className="text-control text-muted m-0 max-w-[60ch]">
        The risk level decides which bucket an asset lands in when a snapshot is taken. An asset
        left unset counts towards none of them.
      </p>
      {assets.map((asset) => {
        const style = styles[asset] ?? { colorHex: null, riskLevel: null };
        const colorId = `asset-color-${asset}`;
        return (
          <div key={asset} className={ROW}>
            <div className="flex items-center gap-3 min-w-0">
              <label htmlFor={colorId} className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <span className="sr-only">Colour for {asset}</span>
                <input
                  id={colorId}
                  name={colorId}
                  type="color"
                  value={style.colorHex ?? DEFAULT_SWATCH}
                  onChange={(e) => onChangeStyle(asset, { colorHex: e.target.value })}
                  className="w-7 h-7 p-0 rounded-sm border border-border bg-transparent cursor-pointer"
                />
              </label>
              <span className="text-sm font-bold text-text truncate">{asset}</span>
            </div>
            <div className="w-[160px] flex-shrink-0 max-sm:w-auto">
              <Select
                ariaLabel={`Risk level for ${asset}`}
                value={style.riskLevel ?? ""}
                onValueChange={(value) =>
                  onChangeStyle(asset, { riskLevel: value === "" ? null : (value as RiskLevel) })
                }
                options={RISK_OPTIONS}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BackupBlock({ backupMessage, onExportJson, onImportJson, onExportXlsx, onImportXlsx }: Pick<MoneySettingsProps, "backupMessage" | "onExportJson" | "onImportJson" | "onExportXlsx" | "onImportXlsx">) {
  const formats = [
    { label: "JSON", hint: "Transactions, movements, snapshots, styles", accept: ".json", onExport: onExportJson, onImport: onImportJson },
    { label: "XLSX", hint: "Spreadsheet, one sheet per table", accept: ".xlsx,.xls", onExport: onExportXlsx, onImport: onImportXlsx },
  ];
  return (
    <div className="grid gap-3">
      <p className="text-control text-muted m-0 max-w-[60ch]">
        Importing replaces the money data on this account — it does not merge.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-2">
        {formats.map((f) => (
          <div key={f.label} className={ROW}>
            <div className="flex flex-col gap-[2px] min-w-0">
              <span className="text-sm font-bold text-text">{f.label}</span>
              <span className="text-xs text-muted">{f.hint}</span>
            </div>
            <div className="flex gap-2 flex-shrink-0 max-sm:justify-end">
              <Button type="button" size="sm" onClick={f.onExport}>Export</Button>
              <label className={`${buttonClass("default", "sm")} relative overflow-hidden cursor-pointer`}>
                Import
                <input
                  type="file"
                  accept={f.accept}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) f.onImport(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <InlineFeedback message={backupMessage} />
    </div>
  );
}

function DangerBlock({ purgeConfirmArmed, purgePending, purgeError, onPurgeArm, onPurgeConfirm, onPurgeCancel }: Pick<MoneySettingsProps, "purgeConfirmArmed" | "purgePending" | "purgeError" | "onPurgeArm" | "onPurgeConfirm" | "onPurgeCancel">) {
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 px-3 py-2 bg-[color-mix(in_srgb,var(--danger)_7%,var(--card))] border-l-2 border-[color-mix(in_srgb,var(--danger)_55%,transparent)] rounded-sm text-muted text-hint leading-normal">
        Permanently deletes every transaction, monthly movement, snapshot and asset style on this
        account. Your health data is not touched. This cannot be undone.
      </p>
      {purgeConfirmArmed ? (
        <div
          className="mt-3 p-3 border border-[color-mix(in_srgb,var(--danger)_40%,var(--border))] rounded-md bg-[color-mix(in_srgb,var(--danger)_8%,var(--card))] grid gap-3"
          role="group"
          aria-label="Confirm purge all money data"
        >
          <InlineFeedback message={{ tone: "warning", text: "This permanently deletes all money data for this account." }} />
          <div className="flex gap-3 items-center flex-wrap">
            <Button type="button" variant="danger" onClick={onPurgeConfirm} disabled={purgePending}>
              {purgePending ? "Purging..." : "Confirm purge money data"}
            </Button>
            <Button type="button" onClick={onPurgeCancel} disabled={purgePending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end pt-2">
          <Button type="button" variant="danger" onClick={onPurgeArm}>
            Purge money data
          </Button>
        </div>
      )}
      <InlineFeedback message={purgeError} />
    </div>
  );
}

export function MoneySettingsSection(props: MoneySettingsProps) {
  const [tab, setTab] = useState<Tab>("preferences");
  const active = TABS.find((t) => t.id === tab);

  return (
    <section className="@container p-2">
      <h1 className="m-0 mb-3 text-title font-bold tracking-tight text-text">Settings</h1>
      <div className="grid gap-5 max-w-[80ch]">
        <nav className="flex flex-wrap gap-y-1 gap-x-5 pb-2" aria-label="Money settings sections">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            const color = t.danger ? "text-danger" : isActive ? "text-text" : "text-muted hover:text-text";
            const border = isActive ? (t.danger ? "border-b-danger" : "border-b-accent") : "border-b-transparent";
            return (
              <button key={t.id} type="button" className={`${TAG_TAB_BTN} ${color} ${border}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3">
          <SectionHead title={active?.label ?? ""} />
          {tab === "preferences" ? <PreferencesBlock {...props} /> : null}
          {tab === "assets" ? <AssetsBlock {...props} /> : null}
          {tab === "backup" ? <BackupBlock {...props} /> : null}
          {tab === "danger" ? <DangerBlock {...props} /> : null}
        </div>
      </div>
    </section>
  );
}
