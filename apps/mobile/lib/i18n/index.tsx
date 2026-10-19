/**
 * Project Synastry i18n.
 *
 * Default language is Turkish, with English as the only alternative. The
 * choice lives in React state (not AsyncStorage yet — persistence is a
 * follow-up). All user-facing strings live in `tr.ts` / `en.ts`, both
 * conforming to the `Translations` interface in `strings.ts`.
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

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { tr } from "./tr";
import { en } from "./en";
import type { Translations } from "./strings";

export type Locale = "tr" | "en";

const TABLES: Record<Locale, Translations> = { tr, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  /** Override the initial locale. Defaults to Turkish. */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = "tr" }: ProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
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
