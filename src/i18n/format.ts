import { LOCALE_META, type Locale } from './config'

/** Locale-aware formatting for dates, numbers and money (TZS). */

const tag = (locale: Locale) => LOCALE_META[locale].bcp47

const toDate = (value: Date | string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatDate = (
  value: Date | string | number | null | undefined,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
) => {
  const date = toDate(value)
  return date ? new Intl.DateTimeFormat(tag(locale), options).format(date) : ''
}

export const formatNumber = (value: number, locale: Locale, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(tag(locale), options).format(value)

/** `TZS 50,000` in English, `TSh 50,000` in Swahili. */
export const formatMoney = (amount: number | null | undefined, locale: Locale, currency = 'TZS') => {
  const value = Number(amount ?? 0)
  const digits = formatNumber(value, locale, { maximumFractionDigits: 0 })
  if (currency !== 'TZS') return `${currency} ${digits}`
  return locale === 'sw' ? `TSh ${digits}` : `TZS ${digits}`
}
