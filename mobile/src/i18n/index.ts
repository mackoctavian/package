import { useEffect, useMemo } from 'react';

import { API_URL } from '@/lib/config';
import { actions, type AppLanguage, getAppState, useAppStore } from '@/lib/store';
import { MOBILE_LOCALES, type MobileLocale, type MobileMessages, mobileMessages } from './messages';
import { createTranslator, flattenMessages, type MessageKey, type Translator } from './translate';

/**
 * App-wide i18n.
 *
 * - The language is the user's choice (More → Language, or the onboarding
 *   picker), or the phone's language until they choose.
 * - Text comes from the built-in catalogue in `./messages`, with any changes
 *   the admin made on the website laid on top (downloaded at start-up and
 *   cached for offline use). Missing Swahili text falls back to English.
 * - Content from the API (retreats, news…) is requested in the same language.
 */

export type { MobileLocale } from './messages';
export type AppMessageKey = MessageKey<MobileMessages>;
export type T = Translator<AppMessageKey>;

const DEFAULTS: Record<MobileLocale, Record<string, string>> = {
  en: flattenMessages(mobileMessages.en),
  sw: flattenMessages(mobileMessages.sw),
};

const isLocale = (value: unknown): value is MobileLocale => MOBILE_LOCALES.includes(value as MobileLocale);

/** The phone's language, if it is one we support. */
export const deviceLocale: MobileLocale = (() => {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale?.toLowerCase() ?? '';
    return tag.startsWith('sw') ? 'sw' : 'en';
  } catch {
    return 'en';
  }
})();

export const LOCALE_TAGS: Record<MobileLocale, string> = { en: 'en-GB', sw: 'sw-TZ' };

const resolve = (language: AppLanguage | null): MobileLocale => (isLocale(language) ? language : deviceLocale);

const build = (locale: MobileLocale, overrides: Partial<Record<AppLanguage, Record<string, string>>>): T => {
  const english = { ...DEFAULTS.en, ...(overrides.en ?? {}) };
  const primary = locale === 'en' ? english : { ...english, ...DEFAULTS[locale], ...(overrides[locale] ?? {}) };
  return createTranslator<AppMessageKey>(locale, primary, english);
};

export const useLocale = (): MobileLocale => useAppStore((s) => resolve(s.language));

/** The chosen language, or `null` when following the phone. */
export const useLanguageChoice = () => useAppStore((s) => s.language);

export const setLanguage = (language: AppLanguage | null) => actions.setLanguage(language);

export function useT(): T {
  const locale = useLocale();
  const overrides = useAppStore((s) => s.uiOverrides);
  return useMemo(() => build(locale, overrides), [locale, overrides]);
}

/** Translator outside React (alerts, helpers called from event handlers). */
export const getT = (): T => {
  const state = getAppState();
  return build(resolve(state.language), state.uiOverrides);
};

export const getLocale = (): MobileLocale => resolve(getAppState().language);

/* ------------------------------------------------------------ formatting */

const toDate = (iso?: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatMoney = (value: number, locale: MobileLocale) => {
  const digits = Math.round(value).toLocaleString('en-US');
  return locale === 'sw' ? `TSh ${digits}` : `TZS ${digits}`;
};

export const formatDateIn = (
  locale: MobileLocale,
  iso?: string | null,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
) => {
  const date = toDate(iso);
  if (!date) return '';
  try {
    return date.toLocaleDateString(LOCALE_TAGS[locale], options);
  } catch {
    return date.toLocaleDateString('en-GB', options);
  }
};

/** Money and dates in the current language. */
export function useFormat() {
  const locale = useLocale();
  return useMemo(
    () => ({
      locale,
      money: (value: number) => formatMoney(value, locale),
      date: (iso?: string | null, options?: Intl.DateTimeFormatOptions) => formatDateIn(locale, iso, options),
      monthDay: (iso?: string | null) => {
        const date = toDate(iso);
        if (!date) return null;
        return { month: formatDateIn(locale, iso, { month: 'short' }).replace('.', '').toUpperCase(), day: String(date.getDate()) };
      },
    }),
    [locale],
  );
}

/* --------------------------------------------------------------- syncing */

const fetchOverrides = async (locale: MobileLocale) => {
  const response = await fetch(`${API_URL}/api/mobile/i18n?locale=${locale}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) return;
  const body = (await response.json()) as { data?: { messages?: Record<string, string> } };
  if (body?.data?.messages && typeof body.data.messages === 'object') actions.setUiOverrides(locale, body.data.messages);
};

/** Downloads the admin's text changes for the current language (and English, the fallback). Silent when offline. */
export function useSyncTranslations() {
  const locale = useLocale();
  const hydrated = useAppStore((s) => s.hydrated);
  useEffect(() => {
    if (!hydrated) return;
    const locales: MobileLocale[] = locale === 'en' ? ['en'] : ['en', locale];
    locales.forEach((item) => fetchOverrides(item).catch(() => undefined));
  }, [locale, hydrated]);
}
