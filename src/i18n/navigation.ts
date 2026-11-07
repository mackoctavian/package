import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from './config'

/**
 * URL helpers. English (the default) has no prefix; other languages are
 * prefixed: `/retreats` (English) and `/sw/retreats` (Swahili).
 */

const isExternal = (href: string) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)

/** Removes a leading locale segment: `/sw/retreats` → `/retreats`. */
export const stripLocale = (pathname: string): string => {
  const segments = pathname.split('/')
  if (isLocale(segments[1])) {
    const rest = `/${segments.slice(2).join('/')}`
    return rest === '/' ? '/' : rest.replace(/\/$/, '') || '/'
  }
  return pathname || '/'
}

/** The locale encoded in a pathname, if any. */
export const localeFromPath = (pathname: string): Locale | null => {
  const first = pathname.split('/')[1]
  return isLocale(first) ? first : null
}

/** Adds the locale prefix a public URL needs. External links, anchors and admin/API URLs are left alone. */
export const localizeHref = (href: string, locale: Locale): string => {
  if (!href || isExternal(href) || !href.startsWith('/')) return href
  if (/^\/(?:api|admin|login|invite|_next)(?:\/|$|\?)/.test(href)) return href
  const match = href.match(/^([^?#]*)(.*)$/)
  const path = stripLocale(match?.[1] || '/')
  const suffix = match?.[2] ?? ''
  if (locale === DEFAULT_LOCALE) return `${path}${suffix}`
  return `${path === '/' ? `/${locale}` : `/${locale}${path}`}${suffix}`
}

/** Absolute URLs for every language version of a path, for `hreflang` alternates and sitemaps. */
export const languageAlternates = (path: string, base = '') => {
  const clean = base.replace(/\/$/, '')
  const languages = Object.fromEntries(LOCALES.map((locale) => [locale, `${clean}${localizeHref(path, locale)}`])) as Record<
    Locale | 'x-default',
    string
  >
  languages['x-default'] = `${clean}${localizeHref(path, DEFAULT_LOCALE)}`
  return languages
}
