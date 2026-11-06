import type { RetreatType } from '@/app/types/retreat'

/**
 * Retreat dates are stored as free text (e.g. "Nov 15 – Nov 19, 2025").
 * These helpers parse them well enough to sort and filter upcoming retreats.
 */

const YEAR_PATTERN = /\b(19|20)\d{2}\b/
const SEPARATORS = ['–', '—', ' to ', ' - ']

const splitDateRange = (value?: string | null): [string, string] => {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ['', '']
  for (const separator of SEPARATORS) {
    if (trimmed.includes(separator)) {
      const [start, end] = trimmed.split(separator)
      return [start?.trim() ?? '', end?.trim() ?? '']
    }
  }
  return [trimmed, '']
}

const extractYear = (value?: string | null) => {
  const match = value?.match(YEAR_PATTERN)
  return match ? Number(match[0]) : null
}

const withYear = (value: string, year: number | null) => {
  if (!value || YEAR_PATTERN.test(value)) return value
  return year ? `${value.replace(/,\s*$/, '')}, ${year}` : value
}

const parseDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export type ParsedRetreatDates = { start: Date | null; end: Date | null }

export const parseRetreatDates = (dateRange?: string | null): ParsedRetreatDates => {
  const [startToken, endToken] = splitDateRange(dateRange)
  const year = extractYear(endToken) ?? extractYear(dateRange)
  const start = parseDate(withYear(startToken, year))
  let end = parseDate(withYear(endToken, year))
  // "Nov 15 – 19, 2025" style ranges: end token has no month
  if (!end && start && /^\d{1,2}(,\s*\d{4})?$/.test(endToken)) {
    end = new Date(start)
    end.setDate(parseInt(endToken, 10))
  }
  return { start, end: end ?? start }
}

const sortKey = (dates: ParsedRetreatDates) => dates.start?.getTime() ?? dates.end?.getTime() ?? Number.POSITIVE_INFINITY

/** Retreats that have not finished yet, soonest first. Unparseable dates are kept at the end. */
export const getUpcomingRetreats = <T extends Pick<RetreatType, 'dateRange'>>(retreats: T[], now = new Date()) => {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return retreats
    .map((retreat) => ({ retreat, dates: parseRetreatDates(retreat.dateRange) }))
    .filter(({ dates }) => {
      const reference = dates.end ?? dates.start
      return !reference || reference >= today
    })
    .sort((a, b) => sortKey(a.dates) - sortKey(b.dates))
}

export const formatRetreatMonthDay = (date: Date | null) =>
  date
    ? {
        month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
        day: date.getDate().toString(),
      }
    : null
