import { useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiEnvelopeSchema, apiFetch, getErrorMessage } from "../lib";
import {
  stylesMapSchema,
  transactionListSchema,
  type RiskLevel,
  type StylesMap,
} from "../app/money/core";
import type { InlineMessage } from "../app/core";

const okSchema = apiEnvelopeSchema(z.object({ ok: z.boolean() }));
const prefsSchema = apiEnvelopeSchema(z.object({ showZeroAssets: z.boolean() }));

function downloadBlob(blob: Blob, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function datedName(extension: string): string {
  return `money-backup-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

export function useMoneySettings(enabled: boolean) {
  const queryClient = useQueryClient();
  const [purgeConfirmArmed, setPurgeConfirmArmed] = useState(false);
  const [backupMessage, setBackupMessage] = useState<InlineMessage | null>(null);

  const prefsQuery = useQuery({
    queryKey: ["money-preferences"],
    enabled,
    queryFn: async () =>
      apiFetch("/api/v1/money/preferences", { method: "GET" }, (raw) => prefsSchema.parse(raw).data),
  });

  const stylesQuery = useQuery({
    queryKey: ["money-styles"],
    enabled,
    queryFn: async () =>
      apiFetch("/api/v1/money/assets/styles", { method: "GET" }, (raw) => stylesMapSchema.parse(raw).data),
  });

  // The asset list comes from the transactions, not from the styles map: an
  // asset you have never styled still needs a row to be styled from.
  const transactionsQuery = useQuery({
    queryKey: ["money-transactions"],
    enabled,
    queryFn: async () =>
      apiFetch("/api/v1/money/transactions", { method: "GET" }, (raw) => transactionListSchema.parse(raw).data),
  });

  const prefsMutation = useMutation({
    mutationFn: async (showZeroAssets: boolean) =>
      apiFetch(
        "/api/v1/money/preferences",
        { method: "PUT", body: JSON.stringify({ showZeroAssets }) },
        (raw) => okSchema.parse(raw).data,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["money-preferences"] });
    },
    onError: () => toast.error("Couldn't save preference. Try again."),
  });

  const stylesMutation = useMutation({
    mutationFn: async (styles: StylesMap) =>
      apiFetch(
        "/api/v1/money/assets/styles",
        { method: "PUT", body: JSON.stringify({ styles }) },
        (raw) => okSchema.parse(raw).data,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["money-styles"] });
    },
    onError: () => toast.error("Couldn't save asset styles. Try again."),
  });

  const purgeMutation = useMutation({
    mutationFn: async () =>
      apiFetch("/api/v1/money/data/purge", { method: "POST" }, (raw) => okSchema.parse(raw).data),
    onSuccess: async () => {
      setPurgeConfirmArmed(false);
      await queryClient.invalidateQueries();
      toast.success("Money data purged");
    },
  });

  const runBackupAction = async (action: () => Promise<void>, done: InlineMessage) => {
    setBackupMessage(null);
    try {
      await action();
      setBackupMessage(done);
      await queryClient.invalidateQueries();
    } catch (error) {
      setBackupMessage({ tone: "error", text: getErrorMessage(error) });
    }
  };

  const exportJson = async () => {
    const payload = await apiFetch("/api/v1/money/backup/json", { method: "GET" }, (raw) => raw);
    const data = (payload as { data: unknown }).data;
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), datedName("json"));
  };

  const importJson = async (file: File) => {
    const parsed: unknown = JSON.parse(await file.text());
    await apiFetch(
      "/api/v1/money/backup/json/import",
      { method: "POST", body: JSON.stringify(parsed) },
      (raw) => raw,
    );
  };

  const exportXlsx = async () => {
    const response = await fetch("/api/v1/money/backup/xlsx", { credentials: "include" });
    if (!response.ok) throw new Error(`Export failed (HTTP ${response.status})`);
    downloadBlob(await response.blob(), datedName("xlsx"));
  };

  const importXlsx = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/v1/money/backup/xlsx/import", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      throw new Error(body?.error?.message ?? `Import failed (HTTP ${response.status})`);
    }
  };

  const styles = stylesQuery.data ?? {};

  return {
    showZeroAssets: prefsQuery.data?.showZeroAssets ?? false,
    onToggleShowZeroAssets: (next: boolean) => prefsMutation.mutate(next),

    styles,
    // Sorted so the list does not reshuffle as transactions come and go.
    assets: Array.from(new Set((transactionsQuery.data ?? []).map((t) => t.asset).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    ),
    stylesLoading: stylesQuery.isLoading || transactionsQuery.isLoading,
    onChangeStyle: (asset: string, patch: { colorHex?: string | null; riskLevel?: RiskLevel | null }) => {
      // The endpoint replaces the whole map, so the patch is merged locally
      // before being sent — sending only the changed asset would wipe the rest.
      const current = styles[asset] ?? { colorHex: null, riskLevel: null };
      stylesMutation.mutate({ ...styles, [asset]: { ...current, ...patch } });
    },

    backupMessage,
    onExportJson: () => void runBackupAction(exportJson, { tone: "info", text: "JSON export started." }),
    onImportJson: (file: File) =>
      void runBackupAction(() => importJson(file), { tone: "success", text: "JSON import completed." }),
    onExportXlsx: () => void runBackupAction(exportXlsx, { tone: "info", text: "Spreadsheet export started." }),
    onImportXlsx: (file: File) =>
      void runBackupAction(() => importXlsx(file), { tone: "success", text: "Spreadsheet import completed." }),

    purgeConfirmArmed,
    purgePending: purgeMutation.isPending,
    purgeError: purgeMutation.error
      ? { tone: "error" as const, text: getErrorMessage(purgeMutation.error) }
      : null,
    onPurgeArm: () => {
      purgeMutation.reset();
      setPurgeConfirmArmed(true);
    },
    onPurgeConfirm: () => purgeMutation.mutate(),
    onPurgeCancel: () => {
      purgeMutation.reset();
      setPurgeConfirmArmed(false);
    },
  };
}
