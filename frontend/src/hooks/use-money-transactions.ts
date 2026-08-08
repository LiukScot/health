import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiEnvelopeSchema, apiFetch } from "../lib";
import {
  freshTxDefaults,
  tipoShowsBuyValue,
  tipoShowsPnl,
  transactionListSchema,
  txFormSchema,
  type Transaction,
  type TxFormValues,
} from "../app/money/core";

const okSchema = apiEnvelopeSchema(z.object({ ok: z.boolean() }));
const createdSchema = apiEnvelopeSchema(z.object({ id: z.string() }));

function buildPayload(values: TxFormValues) {
  const parsed = txFormSchema.parse(values);
  // Whichever amount field the tipo hides is submitted as 0, so switching
  // tipo mid-edit can't smuggle a stale value through.
  const buyValue = tipoShowsBuyValue(parsed.tipo) ? parsed.buyValue : 0;
  const pnl = tipoShowsPnl(parsed.tipo) ? parsed.pnl : 0;
  return {
    txDate: parsed.txDate,
    asset: parsed.asset,
    tipo: parsed.tipo,
    buyValue,
    pnl,
    currentValue: buyValue + pnl,
    note: parsed.note,
  };
}

export function useMoneyTransactions(enabled: boolean) {
  const queryClient = useQueryClient();
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [confirmDeleteTx, setConfirmDeleteTx] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetTimerRef.current), []);

  const txQuery = useQuery({
    queryKey: ["money-transactions"],
    enabled,
    queryFn: async () =>
      apiFetch("/api/v1/money/transactions", { method: "GET" }, (raw) => transactionListSchema.parse(raw).data),
  });

  const txForm = useForm<TxFormValues>({ defaultValues: freshTxDefaults() });

  const txMutation = useMutation({
    mutationFn: async (values: TxFormValues) => {
      const payload = buildPayload(values);
      if (editingTx) {
        return apiFetch(
          `/api/v1/money/transactions/${editingTx.id}`,
          { method: "PUT", body: JSON.stringify(payload) },
          (raw) => okSchema.parse(raw).data,
        );
      }
      return apiFetch(
        "/api/v1/money/transactions",
        { method: "POST", body: JSON.stringify(payload) },
        (raw) => createdSchema.parse(raw).data,
      );
    },
    onSuccess: async () => {
      setEditingTx(null);
      txForm.reset(freshTxDefaults());
      await queryClient.invalidateQueries({ queryKey: ["money-transactions"] });
      toast.success("Transaction saved");
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => txMutation.reset(), 3000);
    },
    onError: () => {
      toast.error("Couldn't save transaction. Try again.");
    },
  });

  const txDeleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/api/v1/money/transactions/${id}`, { method: "DELETE" }, (raw) => okSchema.parse(raw).data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["money-transactions"] });
    },
    onError: () => {
      toast.error("Couldn't delete transaction. Try again.");
    },
  });

  // Memoised, not just `?? []`: a fresh empty array on every render would
  // make the assetOptions memo below recompute forever.
  const transactions = useMemo(() => txQuery.data ?? [], [txQuery.data]);

  // Assets already used are offered as suggestions, so the same holding is
  // not re-typed three slightly different ways.
  const assetOptions = useMemo(
    () => Array.from(new Set(transactions.map((row) => row.asset).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [transactions],
  );

  return {
    transactions,
    assetOptions,
    isLoading: txQuery.isLoading,
    txForm,
    txMutation,
    editingTx,
    confirmDeleteTx,
    resetTxForm: () => {
      setEditingTx(null);
      txForm.reset(freshTxDefaults());
    },
    startTxEdit: (row: Transaction) => {
      setEditingTx(row);
      txForm.reset({
        txDate: row.txDate,
        asset: row.asset,
        tipo: row.tipo,
        buyValue: row.buyValue,
        pnl: row.pnl,
        note: row.note,
      });
    },
    onDeleteClick: (id: string) => {
      if (confirmDeleteTx === id) {
        txDeleteMutation.mutate(id);
        setConfirmDeleteTx(null);
      } else {
        setConfirmDeleteTx(id);
      }
    },
    onDeleteBlur: () => setConfirmDeleteTx(null),
  };
}
