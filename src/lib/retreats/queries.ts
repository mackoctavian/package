import { cache } from 'react'

import prisma from '@/lib/prisma'
import { retreatData } from '@/app/data/retreats'
import { mapPrismaRetreat } from '@/app/api/retreats/utils'
import type { RetreatType } from '@/app/types/retreat'
import { parseRetreatDates } from './dates'

/** Public retreat queries with a static fallback when the database is unreachable. */

export const getAllRetreats = cache(async (): Promise<{ retreats: RetreatType[]; source: 'db' | 'static' }> => {
  try {
    const rows = await prisma.retreat.findMany()
    return { retreats: rows.map(mapPrismaRetreat), source: 'db' }
  } catch (error) {
    console.error('[retreats] database unavailable, using static data', error instanceof Error ? error.message : error)
    return { retreats: retreatData, source: 'static' }
  }
})

export const getRetreatBySlug = cache(async (slug: string): Promise<RetreatType | undefined> => {
  try {
    const row = await prisma.retreat.findUnique({ where: { slug } })
    if (row) return mapPrismaRetreat(row)
  } catch (error) {
    console.error('[retreats] lookup failed', error instanceof Error ? error.message : error)
  }
  return retreatData.find((item) => item.slug === slug)
})

export type RetreatListItem = RetreatType & { startDate: string | null; endDate: string | null }

export const toListItems = (retreats: RetreatType[]): RetreatListItem[] =>
  retreats.map((retreat) => {
    const { start, end } = parseRetreatDates(retreat.dateRange)
    return { ...retreat, startDate: start?.toISOString() ?? null, endDate: end?.toISOString() ?? null }
  })
