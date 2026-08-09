import { lazy, Suspense } from "react";
import type { useAuth } from "../hooks/use-auth";
import { navLabels, type InlineMessage, type NavItem } from "./core";
import { SettingsScreen } from "./SettingsPanel";
import type { MoneySettingsProps } from "./money/MoneySettings";

const DesignSystemSection = lazy(() =>
  import("./DesignSystemSection").then((m) => ({ default: m.DesignSystemSection })),
);

export function SettingsSection({
  nav,
  money,
  ...rest
}: {
  nav: NavItem;
  money: MoneySettingsProps;
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
}) {
  // The design system is a page of its own rather than a settings form, and
  // it is the heaviest thing in the realm, so it stays lazy.
  if (nav === "settings-design-system") {
    return (
      <Suspense fallback={<p className="text-muted text-control">Loading…</p>}>
        <DesignSystemSection />
      </Suspense>
    );
  }

  return (
    <section className="@container">
      <h1 className="m-0 mb-10 [text-box:trim-both_cap_alphabetic] text-title font-bold tracking-tight text-text">{navLabels[nav]}</h1>
      <div className="max-w-[80ch]">
        <SettingsScreen nav={nav} money={money} {...rest} />
      </div>
    </section>
  );
}
