import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { isRecordKind, parseRecordFilters, RECORD_KINDS, recordDelegate, recordWhere } from '@/lib/admin/records'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ kind: string }> }

const startOfMonth = (offset = 0) => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + offset, 1)
}

/** Paged list of donations, Mass intentions or messages, with summary numbers. */
export async function GET(request: Request, { params }: RouteContext) {
  const { kind } = await params
  if (!isRecordKind(kind)) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const auth = await requireAdminApiAccess(RECORD_KINDS[kind].moduleId)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const search = new URL(request.url).searchParams
  const filters = parseRecordFilters(search)
  const page = Math.max(1, Number(search.get('page')) || 1)
  const pageSize = 25
  const delegate = recordDelegate(kind)
  const where = recordWhere(kind, filters)

  try {
    const [rows, total, byStatus] = await Promise.all([
      delegate.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      delegate.count({ where }),
      delegate.groupBy({ by: ['status'], _count: { _all: true } }),
    ])
    const summary: Record<string, unknown> = {
      status: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
    }

    if (kind === 'donations') {
      // Giving totals: this month, last month, this year, by method, and the last 12 months.
      const since = startOfMonth(-11)
      const [paid, byMethod, recent] = await Promise.all([
        prisma.donation.groupBy({ by: ['paymentStatus'], _sum: { amount: true }, _count: { _all: true } }),
        prisma.donation.groupBy({ by: ['paymentMethod'], where: { paymentStatus: 'paid' }, _sum: { amount: true }, _count: { _all: true } }),
        prisma.donation.findMany({ where: { paymentStatus: 'paid', createdAt: { gte: since } }, select: { amount: true, createdAt: true } }),
      ])
      const months = Array.from({ length: 12 }, (_, index) => {
        const start = startOfMonth(index - 11)
        return { month: start.toISOString().slice(0, 7), total: 0, count: 0 }
      })
      for (const gift of recent) {
        const key = gift.createdAt.toISOString().slice(0, 7)
        const bucket = months.find((month) => month.month === key)
        if (bucket) {
          bucket.total += gift.amount
          bucket.count += 1
        }
      }
      const thisMonth = months[11]
      const lastMonth = months[10]
      const yearStart = new Date(new Date().getFullYear(), 0, 1)
      summary.giving = {
        paidTotal: paid.find((row) => row.paymentStatus === 'paid')?._sum.amount ?? 0,
        paidCount: paid.find((row) => row.paymentStatus === 'paid')?._count._all ?? 0,
        pendingTotal: paid.find((row) => row.paymentStatus === 'pending')?._sum.amount ?? 0,
        pendingCount: paid.find((row) => row.paymentStatus === 'pending')?._count._all ?? 0,
        thisMonth: thisMonth.total,
        lastMonth: lastMonth.total,
        thisYear: recent.filter((gift) => gift.createdAt >= yearStart).reduce((sum, gift) => sum + gift.amount, 0),
        byMethod: byMethod.map((row) => ({ method: row.paymentMethod, total: row._sum.amount ?? 0, count: row._count._all })).sort((a, b) => b.total - a.total),
        months,
      }
    }

    if (kind === 'mass-intentions') {
      const now = new Date()
      const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      summary.upcoming = await prisma.massIntention.findMany({
        where: { status: 'scheduled', scheduledFor: { gte: new Date(now.toDateString()), lte: weekAhead } },
        orderBy: { scheduledFor: 'asc' },
        take: 10,
        select: { id: true, fullName: true, intentionFor: true, intentionType: true, scheduledFor: true, celebrant: true },
      })
    }

    return NextResponse.json({ data: rows, page, pageSize, total, summary })
  } catch (error) {
    console.error(`[records:${kind}][GET]`, error)
    return NextResponse.json({ error: 'Unable to load records.' }, { status: 500 })
  }
}
