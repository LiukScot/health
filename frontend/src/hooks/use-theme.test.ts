import { describe, expect, test, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { readStoredTheme, useTheme } from "./use-theme";
import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES, themeIds } from "../app/core";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("readStoredTheme", () => {
  test("returns the default theme when nothing is stored", () => {
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
  });

  test("returns a valid stored theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "grey");
    expect(readStoredTheme()).toBe("grey");
  });

  test("ignores an unknown stored value and falls back to default", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "rainbow");
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
  });
});

describe("useTheme", () => {
  test("setTheme persists to localStorage and sets the data-theme attribute", () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("grey"));

    expect(result.current.theme).toBe("grey");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("grey");
    expect(document.documentElement.dataset.theme).toBe("grey");
  });
});

describe("THEMES", () => {
  test("every theme id is a known theme and bg is a hex color", () => {
    for (const theme of THEMES) {
      expect(themeIds).toContain(theme.id);
      expect(theme.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
