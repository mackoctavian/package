import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { bookingWhere, parseBookingFilters, partySize } from '@/lib/admin/bookings'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

/** Paged, filtered booking list for the admin bookings table, with totals. */
export async function GET(request: Request) {
  const auth = await requireAdminApiAccess('retreats')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const params = new URL(request.url).searchParams
  const filters = parseBookingFilters(params)
  const page = Math.max(1, Number(params.get('page')) || 1)
  const pageSize = Math.min(100, Math.max(10, Number(params.get('pageSize')) || PAGE_SIZE))
  const where = bookingWhere(filters)
  const scope = filters.retreatId ? { retreatId: filters.retreatId } : {}

  try {
    const [rows, total, byStatus, byPayment, checkedIn, retreats] = await Promise.all([
      prisma.retreatBooking.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.retreatBooking.count({ where }),
      prisma.retreatBooking.groupBy({ by: ['status'], where: scope, _count: { _all: true } }),
      prisma.retreatBooking.groupBy({ by: ['paymentStatus'], where: { ...scope, status: { not: 'cancelled' } }, _count: { _all: true } }),
      prisma.retreatBooking.count({ where: { ...scope, attended: true } }),
      prisma.retreat.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, title: true, dateRange: true, status: true } }),
    ])

    const statusCounts = Object.fromEntries(byStatus.map((row) => [row.status, row._count._all]))
    const paymentCounts = Object.fromEntries(byPayment.map((row) => [row.paymentStatus, row._count._all]))

    return NextResponse.json({
      data: rows.map((row) => ({
        id: row.id,
        retreatId: row.retreatId,
        retreatTitle: row.retreatTitle,
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        partySize: partySize(row),
        status: row.status,
        paymentStatus: row.paymentStatus,
        ticketCode: row.ticketCode,
        attended: row.attended,
        checkedInAt: row.checkedInAt,
        createdAt: row.createdAt,
      })),
      page,
      pageSize,
      total,
      summary: {
        all: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
        status: statusCounts,
        payment: paymentCounts,
        checkedIn,
      },
      retreats,
    })
  } catch (error) {
    console.error('[admin-bookings][GET]', error)
    return NextResponse.json({ error: 'Unable to load bookings.' }, { status: 500 })
  }
}
