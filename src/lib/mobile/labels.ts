import { DEFAULT_LOCALE, type Locale } from '@/i18n/config'
import { getDefaultFlatMessages } from '@/i18n/server'
import { createTranslator } from '@/i18n/translate'
import type { Publication } from '@/lib/publications/format'

/** A translator over the built-in website messages, for labels the API sends to the app. */
export const labelTranslator = (locale: Locale) =>
  createTranslator(locale, getDefaultFlatMessages(locale), getDefaultFlatMessages(DEFAULT_LOCALE))

/** Adds `categoryLabel` / `formatLabel` in the requested language; `category` / `format` stay English for filtering. */
export const withPublicationLabels = (items: Publication[], locale: Locale) => {
  const t = labelTranslator(locale)
  return items.map((item) => ({
    ...item,
    categoryLabel: t.dynamic(`publications.categories.${item.category}`, undefined, item.category),
    formatLabel: t.dynamic(`publications.formats.${item.format}`, undefined, item.format),
  }))
}
