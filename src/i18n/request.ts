import { DEFAULT_LOCALE, LOCALE_HEADER, isLocale, matchAcceptLanguage, toLocale, type Locale } from './config'

/**
 * The language an API request asks for:
 *   1. `?locale=sw` (or `?lang=sw`) on the URL
 *   2. the `x-dmrc-locale` header
 *   3. optionally the `Accept-Language` header (public/mobile endpoints only;
 *      admin endpoints must not change language based on the browser)
 * Falls back to English.
 */
export const localeFromRequest = (request: Request, { acceptLanguage = false } = {}): Locale => {
  const url = new URL(request.url)
  const query = url.searchParams.get('locale') ?? url.searchParams.get('lang')
  if (query) return toLocale(query)
  const header = request.headers.get(LOCALE_HEADER)
  if (isLocale(header)) return header
  if (acceptLanguage) return matchAcceptLanguage(request.headers.get('accept-language')) ?? DEFAULT_LOCALE
  return DEFAULT_LOCALE
}
