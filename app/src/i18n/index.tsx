import { createContext, useContext, useMemo, type ReactNode } from "react";
import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { SUPPORTED_LANGUAGES, type Language, type LanguagePref } from "../types";
import { en } from "./locales/en";
import { cs } from "./locales/cs";
import { de } from "./locales/de";
import { sk } from "./locales/sk";

// Singleton translator. Kept in sync with the active language so module-level
// call sites (provider setup hints, error strings) translate without React.
export const i18n = new I18n({ en, cs, de, sk });
i18n.defaultLocale = "en";
i18n.enableFallback = true;
i18n.missingBehavior = "guess"; // humanize an unknown key instead of throwing

// West-Slavic plural rules (cs/sk): 1 → one, 2–4 → few, else → many.
const westSlavic = (_i18n: I18n, count: number): string[] => {
  if (count === 1) return ["one"];
  if (count >= 2 && count <= 4) return ["few"];
  return ["many", "other"];
};
i18n.pluralization.register("cs", westSlavic);
i18n.pluralization.register("sk", westSlavic);

const isSupported = (code: string): code is Language =>
  (SUPPORTED_LANGUAGES as readonly string[]).includes(code);

// The device's most-preferred language we can honour, else the fallback (en).
export function deviceLanguage(): Language {
  for (const loc of Localization.getLocales()) {
    const code = (loc.languageCode ?? "").toLowerCase();
    if (isSupported(code)) return code;
  }
  return "en";
}

// Resolve a stored preference ("system" or a fixed language) to a concrete one.
export function resolveLanguage(pref: LanguagePref | undefined): Language {
  return !pref || pref === "system" ? deviceLanguage() : pref;
}

// Non-React translation for module-level use (accounting providers, App alerts).
export function t(key: string, opts?: Record<string, unknown>): string {
  return i18n.t(key, opts);
}

type Ctx = { t: typeof t; language: Language };
const I18nContext = createContext<Ctx | null>(null);

// Wrap the app; pass the resolved language. Changing `language` re-renders the
// whole subtree (context value identity changes) so every screen re-translates.
export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  i18n.locale = language; // idempotent; also keeps the singleton current for t()
  const value = useMemo<Ctx>(() => ({ t: (k, o) => i18n.t(k, o), language }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
