import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { siteConfig } from '@/app/data/site'
import { LOCALE_META, isLocale, type Locale } from './config'
import { languageAlternates, localizeHref } from './navigation'

/** Props every page under `app/[locale]` receives. */
export type LocaleParams<P extends Record<string, string> = Record<never, string>> = {
  params: Promise<{ locale: string } & P>
}

/** Validates the `[locale]` segment (unknown values are a 404). */
export const resolveLocale = async (params: Promise<{ locale: string }>): Promise<Locale> => {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return locale
}

/**
 * Adds the canonical URL, `hreflang` alternates and Open Graph locale for a
 * page, so search engines index each language version separately.
 */
export const pageMetadata = (locale: Locale, path: string, metadata: Metadata = {}): Metadata => ({
  ...metadata,
  alternates: {
    ...metadata.alternates,
    canonical: localizeHref(path, locale),
    languages: languageAlternates(path),
  },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    ...(typeof metadata.description === 'string' ? { description: metadata.description } : {}),
    ...metadata.openGraph,
    locale: LOCALE_META[locale].ogLocale,
    url: `${siteConfig.url.replace(/\/$/, '')}${localizeHref(path, locale)}`,
  },
})
