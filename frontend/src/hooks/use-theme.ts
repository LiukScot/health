import { useState } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, themeIds, type ThemeId } from "../app/core";

export function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && (themeIds as readonly string[]).includes(stored)) {
      return stored as ThemeId;
    }
  } catch {
    // localStorage unavailable (private mode, disabled) — fall back to default.
  }
  return DEFAULT_THEME;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    document.documentElement.dataset.theme = id;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // Persisting is best-effort; the live attribute change still applies.
    }
  };

  return { theme, setTheme };
}
