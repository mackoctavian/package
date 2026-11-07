/**
 * Runs a query for an admin widget and falls back instead of failing the
 * whole page, e.g. while a new table has not been created yet.
 */
export async function safeQuery<T>(query: () => Promise<T>, fallback: T, label?: string): Promise<T> {
  try {
    return await query()
  } catch (error) {
    console.error(`[admin] ${label ?? 'query'} failed:`, error instanceof Error ? error.message : error)
    return fallback
  }
}

export const formatTZS = (amount: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount)

export const relativeTime = (date: Date | string) => {
  const value = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.round((value.getTime() - Date.now()) / 1000)
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}
