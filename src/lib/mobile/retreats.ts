import type { RetreatType } from '@/app/types/retreat'
import { categoryLabel } from '@/lib/retreats/categories'
import { parseRetreatDates } from '@/lib/retreats/dates'

/** Returns a shallow copy of `value` without `keys`. */
export const omit = <T extends object, K extends keyof T>(value: T, keys: K[]): Omit<T, K> => {
  const copy = { ...value }
  for (const key of keys) delete copy[key]
  return copy
}

export type MobileRetreat = Omit<RetreatType, 'bookings' | 'detailHref' | 'ctaHref'> & {
  categoryLabel: string
  startDate: string | null
  endDate: string | null
  ended: boolean
}

/** Shapes retreats for the app: upcoming soonest first, then past retreats newest first. */
export const toMobileRetreats = (retreats: RetreatType[], now = new Date()): MobileRetreat[] => {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const items = retreats.map((source) => {
    // Bookings and web-only links are never exposed to the app.
    const retreat = omit(source, ['bookings', 'detailHref', 'ctaHref'])
    const { start, end } = parseRetreatDates(retreat.dateRange)
    const reference = end ?? start
    return {
      ...retreat,
      categoryLabel: categoryLabel(retreat.category),
      startDate: start?.toISOString() ?? null,
      endDate: end?.toISOString() ?? null,
      ended: Boolean(reference && reference < today),
    }
  })

  const time = (value: string | null) => (value ? new Date(value).getTime() : Number.POSITIVE_INFINITY)
  const upcoming = items.filter((item) => !item.ended).sort((a, b) => time(a.startDate) - time(b.startDate))
  const past = items.filter((item) => item.ended).sort((a, b) => time(b.startDate) - time(a.startDate))
  return [...upcoming, ...past]
}
