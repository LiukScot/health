import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiEnvelopeSchema, apiFetch } from "../lib";
import {
  freshMovementDefaults,
  movementFormSchema,
  movementListSchema,
  toCadence,
  type Movement,
  type MovementFormValues,
} from "../app/money/core";

const okSchema = apiEnvelopeSchema(z.object({ ok: z.boolean() }));
const createdSchema = apiEnvelopeSchema(z.object({ id: z.string() }));

export function useMoneyMovements(enabled: boolean) {
  const queryClient = useQueryClient();
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [confirmDeleteMovement, setConfirmDeleteMovement] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetTimerRef.current), []);

  const movementsQuery = useQuery({
    queryKey: ["money-movements"],
    enabled,
    queryFn: async () =>
      apiFetch("/api/v1/money/monthly-movements", { method: "GET" }, (raw) => movementListSchema.parse(raw).data),
  });

  const movementForm = useForm<MovementFormValues>({ defaultValues: freshMovementDefaults() });

  const movementMutation = useMutation({
    mutationFn: async (values: MovementFormValues) => {
      const payload = movementFormSchema.parse(values);
      if (editingMovement) {
        return apiFetch(
          `/api/v1/money/monthly-movements/${editingMovement.id}`,
          { method: "PUT", body: JSON.stringify(payload) },
          (raw) => okSchema.parse(raw).data,
        );
      }
      return apiFetch(
        "/api/v1/money/monthly-movements",
        { method: "POST", body: JSON.stringify(payload) },
        (raw) => createdSchema.parse(raw).data,
      );
    },
    onSuccess: async () => {
      setEditingMovement(null);
      movementForm.reset(freshMovementDefaults());
      await queryClient.invalidateQueries({ queryKey: ["money-movements"] });
      toast.success("Movement saved");
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => movementMutation.reset(), 3000);
    },
    onError: () => {
      toast.error("Couldn't save movement. Try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/api/v1/money/monthly-movements/${id}`, { method: "DELETE" }, (raw) => okSchema.parse(raw).data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["money-movements"] });
    },
    onError: () => {
      toast.error("Couldn't delete movement. Try again.");
    },
  });

  return {
    movements: movementsQuery.data ?? [],
    isLoading: movementsQuery.isLoading,
    movementForm,
    movementMutation,
    editingMovement,
    confirmDeleteMovement,
    resetMovementForm: () => {
      setEditingMovement(null);
      movementForm.reset(freshMovementDefaults());
    },
    startMovementEdit: (row: Movement) => {
      setEditingMovement(row);
      movementForm.reset({
        name: row.name,
        direction: row.direction === "expense" ? "expense" : "income",
        amount: row.amount,
        cadence: toCadence(row.cadence),
        note: row.note,
      });
    },
    onDeleteClick: (id: string) => {
      if (confirmDeleteMovement === id) {
        deleteMutation.mutate(id);
        setConfirmDeleteMovement(null);
      } else {
        setConfirmDeleteMovement(id);
      }
    },
    onDeleteBlur: () => setConfirmDeleteMovement(null),
  };
}
