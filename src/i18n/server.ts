import { cache } from 'react'

import prisma from '@/lib/prisma'
import { DEFAULT_LOCALE, SOURCE_LOCALE, type Locale } from './config'
import { DEFAULT_MESSAGES, type AppMessageKey } from './messages'
import { createTranslator, flattenMessages } from './translate'

/**
 * Server-side i18n. Pages call `setRequestLocale(params.locale)` first; any
 * server component rendered below can then call `await getT()` without
 * having the locale passed down as a prop.
 */

const requestStore = cache(() => ({ locale: DEFAULT_LOCALE as Locale }))

export const setRequestLocale = (locale: Locale) => {
  requestStore().locale = locale
}

export const getRequestLocale = (): Locale => requestStore().locale

const DEFAULT_FLAT = {
  en: flattenMessages(DEFAULT_MESSAGES.en),
  sw: flattenMessages(DEFAULT_MESSAGES.sw),
} satisfies Record<Locale, Record<string, string>>

export const getDefaultFlatMessages = (locale: Locale) => DEFAULT_FLAT[locale]

/** Admin overrides for interface text. Never throws: an empty map means "use the built-in text". */
export const getUiOverrides = cache(async (scope: 'web' | 'mobile', locale: Locale): Promise<Record<string, string>> => {
  try {
    const rows = await prisma.uiTranslation.findMany({ where: { scope, locale }, select: { key: true, value: true } })
    return Object.fromEntries(rows.filter((row) => row.value.trim()).map((row) => [row.key, row.value]))
  } catch (error) {
    console.error('[i18n] could not load interface overrides', error instanceof Error ? error.message : error)
    return {}
  }
})

/**
 * Every website string for a language, flattened, with English filled in
 * wherever a translation is missing and admin overrides applied on top.
 */
export const getMessages = cache(async (locale: Locale): Promise<Record<string, string>> => {
  const [sourceOverrides, localeOverrides] = await Promise.all([
    getUiOverrides('web', SOURCE_LOCALE),
    locale === SOURCE_LOCALE ? Promise.resolve({}) : getUiOverrides('web', locale),
  ])
  const english = { ...DEFAULT_FLAT[SOURCE_LOCALE], ...sourceOverrides }
  if (locale === SOURCE_LOCALE) return english
  return { ...english, ...DEFAULT_FLAT[locale], ...localeOverrides }
})

/** Translator for server components, metadata and route handlers. */
export const getT = async (locale: Locale = getRequestLocale()) => createTranslator<AppMessageKey>(locale, await getMessages(locale))
