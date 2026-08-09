import { useMemo } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiEnvelopeSchema, apiFetch } from "../lib";
import {
  computeKpis,
  computePerAsset,
  filterVisibleAssets,
  movementListSchema,
  stylesMapSchema,
  transactionListSchema,
} from "../app/money/core";

const okSchema = apiEnvelopeSchema(z.object({ ok: z.boolean() }));
const prefsSchema = apiEnvelopeSchema(z.object({ showZeroAssets: z.boolean() }));

export function useMoneyDashboard(enabled: boolean) {
  const queryClient = useQueryClient();

  // All four keys are shared with the panels that own them, so arriving here
  // from Transactions or Settings reuses what is already cached.
  const transactionsQuery = useQuery({
    queryKey: ["money-transactions"],
    enabled,
    queryFn: async () =>
      apiFetch("/api/v1/money/transactions", { method: "GET" }, (raw) => transactionListSchema.parse(raw).data),
  });

  const movementsQuery = useQuery({
    queryKey: ["money-movements"],
    enabled,
    queryFn: async () =>
      apiFetch("/api/v1/money/monthly-movements", { method: "GET" }, (raw) => movementListSchema.parse(raw).data),
  });

  const stylesQuery = useQuery({
    queryKey: ["money-styles"],
    enabled,
    queryFn: async () =>
      apiFetch("/api/v1/money/assets/styles", { method: "GET" }, (raw) => stylesMapSchema.parse(raw).data),
  });

  const prefsQuery = useQuery({
    queryKey: ["money-preferences"],
    enabled,
    queryFn: async () =>
      apiFetch("/api/v1/money/preferences", { method: "GET" }, (raw) => prefsSchema.parse(raw).data),
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

  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);
  const movements = useMemo(() => movementsQuery.data ?? [], [movementsQuery.data]);
  const styles = useMemo(() => stylesQuery.data ?? {}, [stylesQuery.data]);
  const showZeroAssets = prefsQuery.data?.showZeroAssets ?? false;

  const allAssets = useMemo(() => computePerAsset(transactions, styles), [transactions, styles]);
  const visibleAssets = useMemo(
    // Biggest holding first: the chart legend and the list then agree.
    () => filterVisibleAssets(allAssets, showZeroAssets).sort((a, b) => b.current - a.current),
    [allAssets, showZeroAssets],
  );

  return {
    kpis: useMemo(() => computeKpis(transactions, movements), [transactions, movements]),
    visibleAssets,
    hiddenAssetCount: allAssets.length - visibleAssets.length,
    showZeroAssets,
    onToggleShowZeroAssets: (next: boolean) => prefsMutation.mutate(next),
    // Styles and preferences are part of the answer, not decoration: without
    // them every asset renders as "no risk" and zero-value assets stay hidden,
    // then both flip once the queries land.
    isLoading:
      transactionsQuery.isLoading ||
      movementsQuery.isLoading ||
      stylesQuery.isLoading ||
      prefsQuery.isLoading,
  };
}
