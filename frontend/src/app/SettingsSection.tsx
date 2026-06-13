import type { useAuth } from "../hooks/use-auth";
import { type InlineMessage } from "./core";
import { SettingsPanel } from "./SettingsPanel";

export function SettingsSection({
  auth,
  birthday,
  birthdayPending,
  onSaveBirthday,
  purgeConfirmArmed,
  purgePending,
  purgeError,
  onPurgeArm,
  onPurgeConfirm,
  onPurgeCancel,
  onExportJson,
  onImportJson,
  onExportXlsx,
  onImportXlsx,
}: {
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
  const variantProps = {
    auth,
    birthday,
    birthdayPending,
    onSaveBirthday,
    purgeConfirmArmed,
    purgePending,
    purgeError,
    onPurgeArm,
    onPurgeConfirm,
    onPurgeCancel,
    onExportJson,
    onImportJson,
    onExportXlsx,
    onImportXlsx,
  };
  return (
    <section className="panel panel--frameless">
      <h1 className="panel-title">Settings</h1>
      <SettingsPanel {...variantProps} />
    </section>
  );
}
