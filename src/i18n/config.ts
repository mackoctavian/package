/**
 * Language configuration shared by the website, the admin panel, the API and
 * (by convention) the mobile app.
 *
 * English is the source language: every piece of content is written in
 * English first and may be translated. When a translation is missing we fall
 * back to English, so a page is never blank.
 *
 * Routing: English pages live at the bare URL (`/retreats`) and Swahili pages
 * under a prefix (`/sw/retreats`). `src/proxy.ts` maps bare URLs onto the
 * internal `/en/...` route and remembers each visitor's choice in a cookie.
 */

export const LOCALES = ['en', 'sw'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'
/** The language every piece of content is authored in. */
export const SOURCE_LOCALE: Locale = 'en'

/** Cookie that stores the visitor's chosen language (shared with the proxy). */
export const LOCALE_COOKIE = 'DMRC_LOCALE'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Request header the proxy uses to tell API routes which language was negotiated. */
export const LOCALE_HEADER = 'x-dmrc-locale'

export const LOCALE_META: Record<Locale, { name: string; nativeName: string; short: string; bcp47: string; ogLocale: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', short: 'EN', bcp47: 'en-TZ', ogLocale: 'en_TZ', flag: '🇬🇧' },
  sw: { name: 'Swahili', nativeName: 'Kiswahili', short: 'SW', bcp47: 'sw-TZ', ogLocale: 'sw_TZ', flag: '🇹🇿' },
}

export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

/** Normalises any user input (`"SW"`, `"sw-TZ"`, `"kiswahili"`) to a supported locale. */
export const toLocale = (value: unknown, fallback: Locale = DEFAULT_LOCALE): Locale => {
  if (typeof value !== 'string') return fallback
  const lower = value.trim().toLowerCase()
  if (isLocale(lower)) return lower
  const base = lower.split(/[-_]/)[0]
  if (isLocale(base)) return base
  if (lower === 'kiswahili' || lower === 'swahili') return 'sw'
  if (lower === 'english') return 'en'
  return fallback
}

/** Picks the best supported locale from an `Accept-Language` header. */
export const matchAcceptLanguage = (header: string | null | undefined): Locale | null => {
  if (!header) return null
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      return { tag: tag.toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1 }
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q)
  for (const entry of ranked) {
    const base = entry.tag.split('-')[0]
    if (isLocale(base)) return base
  }
  return null
}
