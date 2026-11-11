import { NextResponse, type NextRequest } from 'next/server'

import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale, matchAcceptLanguage, toLocale, type Locale } from '@/i18n/config'

/**
 * Language routing for the public website.
 *
 *   /retreats        English (served internally from /en/retreats)
 *   /sw/retreats     Swahili
 *   /en/retreats     → 308 to /retreats (one canonical English URL)
 *   /retreats?lang=sw → redirect to /sw/retreats (shareable language links)
 *
 * A visitor's choice is stored in a cookie. First-time visitors without a
 * cookie get the language their browser prefers (Swahili or English).
 * The admin panel, API, auth pages and static files are never touched.
 */

const remember = (response: NextResponse, request: NextRequest, locale: Locale) => {
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: 'lax' })
  }
  return response
}

const withPrefix = (locale: Locale, path: string) => (locale === DEFAULT_LOCALE ? path : `/${locale}${path === '/' ? '' : path}`)

export function proxy(request: NextRequest) {
  const url = request.nextUrl
  const segments = url.pathname.split('/')
  const first = segments[1]

  // Explicit ?lang= switch, e.g. from a shared link or the mobile app.
  const requested = url.searchParams.get('lang')
  if (requested) {
    const locale = toLocale(requested)
    const target = url.clone()
    target.searchParams.delete('lang')
    const bare = isLocale(first) ? `/${segments.slice(2).join('/')}` : url.pathname
    target.pathname = withPrefix(locale, bare)
    return remember(NextResponse.redirect(target), request, locale)
  }

  if (isLocale(first)) {
    // `/en/...` has a single canonical English URL without the prefix.
    if (first === DEFAULT_LOCALE) {
      const target = url.clone()
      target.pathname = `/${segments.slice(2).join('/')}`
      return remember(NextResponse.redirect(target, 308), request, DEFAULT_LOCALE)
    }
    return remember(NextResponse.next(), request, first)
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value
  const preferred = isLocale(saved) ? saved : (matchAcceptLanguage(request.headers.get('accept-language')) ?? DEFAULT_LOCALE)

  if (preferred !== DEFAULT_LOCALE) {
    const target = url.clone()
    target.pathname = withPrefix(preferred, url.pathname)
    return remember(NextResponse.redirect(target), request, preferred)
  }

  const target = url.clone()
  target.pathname = `/${DEFAULT_LOCALE}${url.pathname === '/' ? '' : url.pathname}`
  const response = NextResponse.rewrite(target)
  // Only store an explicit English choice; leave first-time visitors undecided.
  return isLocale(saved) ? remember(response, request, DEFAULT_LOCALE) : response
}

export const config = {
  // Everything except the admin, API, auth flows, Next internals and files with an extension.
  matcher: ['/((?!api|admin|login|invite|_next|_vercel|.*\\..*).*)'],
}
