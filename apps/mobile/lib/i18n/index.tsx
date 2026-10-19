/**
 * Project Synastry i18n.
 *
 * Turkish and English. The first launch follows the device language (Turkish
 * unless the device is set to something else); after that the user's choice
 * from the About tab is remembered. All user-facing strings live in `tr.ts` /
 * `en.ts`, both conforming to the `Translations` interface in `strings.ts`.
 *
 * Usage:
 *
 *   import { useT } from "@/lib/i18n";
 *
 *   const t = useT();
 *   t.form.title;
 *   t.advanced.summary(5, 2);
 *   t.results.places.title(3);
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { loadJSON, saveJSON } from "@/lib/persist";
import { tr } from "./tr";
import { en } from "./en";
import type { Translations } from "./strings";

export type Locale = "tr" | "en";

const TABLES: Record<Locale, Translations> = { tr, en };
const STORAGE_KEY = "synastry.locale";

const isLocale = (value: unknown): value is Locale => value === "tr" || value === "en";

/** Turkish unless the device language is clearly something else. */
function deviceLocale(): Locale {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    return tag.startsWith("tr") ? "tr" : "en";
  } catch {
    return "tr";
  }
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  /** Override the initial locale (tests, previews). Defaults to the device language. */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: ProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? deviceLocale);

  useEffect(() => {
    if (initialLocale) return;
    let cancelled = false;
    loadJSON(STORAGE_KEY, isLocale).then((saved) => {
      if (saved && !cancelled) setLocaleState(saved);
    });
    return () => {
      cancelled = true;
    };
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void saveJSON(STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: TABLES[locale],
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Returns the active translation table. Re-renders on locale change. */
export function useT(): Translations {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT must be called inside <I18nProvider>");
  }
  return ctx.t;
}

/** Returns the current locale + setter. */
export function useLocale(): { locale: Locale; setLocale: (next: Locale) => void } {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useLocale must be called inside <I18nProvider>");
  }
  return { locale: ctx.locale, setLocale: ctx.setLocale };
}
