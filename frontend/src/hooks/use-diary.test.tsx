import { describe, expect, test, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDiary } from "./use-diary";
import { apiFetch } from "../lib";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock only the network boundary; keep every other lib export real so the
// real getErrorMessage / splitDateTime / schemas run unchanged.
vi.mock("../lib", async (importActual) => {
  const actual = await importActual<typeof import("../lib")>();
  return { ...actual, apiFetch: vi.fn() };
});

const mockApiFetch = vi.mocked(apiFetch);
const mockToastError = vi.mocked(toast.error);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Minimal values that satisfy diaryFormSchema (dateTime min(1), rest default).
const validValues = {
  dateTime: "2026-06-07T10:30",
  moodLevel: null,
  depressionLevel: null,
  anxietyLevel: null,
  positiveMoods: "",
  negativeMoods: "",
  generalMoods: "",
  description: "",
  gratitude: "",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useDiary diaryMutation error contract", () => {
  test("shows an error toast when the mutation rejects", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("Network down"));

    const { result } = renderHook(() => useDiary(false), {
      wrapper: createWrapper(),
    });

    result.current.diaryMutation.mutate(validValues);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Network down");
    });
  });

  test("does not show an error toast when the mutation succeeds", async () => {
    mockApiFetch.mockResolvedValueOnce({ id: 1 });

    const { result } = renderHook(() => useDiary(false), {
      wrapper: createWrapper(),
    });

    result.current.diaryMutation.mutate(validValues);

    await waitFor(() => {
      expect(result.current.diaryMutation.isSuccess).toBe(true);
    });
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
