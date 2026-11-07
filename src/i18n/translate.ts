import type { Locale } from './config'

/**
 * A small, dependency-free message formatter.
 *
 *   t('booking.title')                         → plain lookup
 *   t('booking.placesLeft', { count: 3 })      → `{count}` interpolation
 *   t('booking.guests', { count: 1 })          → plural: uses `guests_one` /
 *                                                `guests_other` when they exist
 *
 * Missing keys fall back to English, then to the key itself, so a gap in a
 * translation never breaks a page.
 */

export type MessageTree = { [key: string]: string | MessageTree }

/** Same shape as T, with every leaf a string. Used to make sure Swahili covers every English key. */
export type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> }

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never

/** Every dotted key of a message tree, e.g. `"home.hero.title"`. Plural forms are addressed by their base key. */
export type MessageKey<T> = {
  [K in keyof T & string]: T[K] extends string ? (K extends `${infer Base}_${'one' | 'other'}` ? Base : K) : Join<K, MessageKey<T[K]>>
}[keyof T & string]

export type TranslateValues = Record<string, string | number | null | undefined>

export type Translator<K extends string = string> = {
  (key: K, values?: TranslateValues): string
  /** Like `t`, but returns undefined instead of the key when nothing is found. */
  maybe: (key: string, values?: TranslateValues) => string | undefined
  /** Untyped lookup for keys built at runtime (e.g. `nav.${id}`); falls back to `fallback` or the key. */
  dynamic: (key: string, values?: TranslateValues, fallback?: string) => string
  locale: Locale
}

/** Flattens a message tree into `{ "a.b.c": "text" }`. */
export const flattenMessages = (tree: MessageTree, prefix = '', out: Record<string, string> = {}) => {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out[path] = value
    else flattenMessages(value, path, out)
  }
  return out
}

const PLURAL_RULES = new Map<string, Intl.PluralRules>()
const pluralCategory = (locale: Locale, count: number) => {
  let rules = PLURAL_RULES.get(locale)
  if (!rules) {
    rules = new Intl.PluralRules(locale)
    PLURAL_RULES.set(locale, rules)
  }
  return rules.select(count) === 'one' ? 'one' : 'other'
}

const interpolate = (template: string, values?: TranslateValues, locale?: Locale) =>
  values
    ? template.replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = values[name]
        if (value === undefined || value === null) return match
        return typeof value === 'number' ? value.toLocaleString(locale) : String(value)
      })
    : template

/**
 * Builds a translator over flat message maps. `primary` is the requested
 * language (with admin overrides already merged in); `fallback` is English.
 */
export const createTranslator = <K extends string = string>(
  locale: Locale,
  primary: Record<string, string>,
  fallback: Record<string, string> = primary,
): Translator<K> => {
  const lookup = (key: string, values?: TranslateValues) => {
    const count = values?.count
    if (typeof count === 'number') {
      const form = `${key}_${pluralCategory(locale, count)}`
      const plural = primary[form] ?? fallback[form] ?? primary[`${key}_other`] ?? fallback[`${key}_other`]
      if (plural !== undefined) return plural
    }
    return primary[key] ?? fallback[key]
  }
  const t = ((key: string, values?: TranslateValues) => {
    const message = lookup(key, values)
    return message === undefined ? key : interpolate(message, values, locale)
  }) as unknown as Translator<K>
  t.maybe = (key, values) => {
    const message = lookup(key, values)
    return message === undefined ? undefined : interpolate(message, values, locale)
  }
  t.dynamic = (key, values, fallbackText) => t.maybe(key, values) ?? fallbackText ?? key
  t.locale = locale
  return t
}
