import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { partySize } from '@/lib/admin/bookings'
import { guardAnyAdminApi } from '@/lib/auth/api-guard'

export const dynamic = 'force-dynamic'

/**
 * Live numbers for the check-in desk: expected vs arrived guests for one
 * retreat and the latest arrivals. Polled every few seconds by the scanner.
 */
export async function GET(request: Request) {
  const access = await guardAnyAdminApi([
    ['retreats', 'view'],
    ['check-in', 'view'],
  ])
  if ('denied' in access) return access.denied

  const retreatId = new URL(request.url).searchParams.get('retreatId') || undefined

  try {
    const retreats = await prisma.retreat.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, dateRange: true, status: true },
    })
    if (!retreatId) return NextResponse.json({ data: null, retreats })

    const bookings = await prisma.retreatBooking.findMany({
      where: { retreatId, status: 'approved' },
      select: { id: true, fullName: true, ticketCode: true, attended: true, checkedInAt: true, familyMembers: true, phone: true },
    })
    const arrived = bookings.filter((booking) => booking.attended)
    const recent = [...arrived]
      .sort((a, b) => (b.checkedInAt?.getTime() ?? 0) - (a.checkedInAt?.getTime() ?? 0))
      .slice(0, 12)
      .map((booking) => ({ id: booking.id, fullName: booking.fullName, ticketCode: booking.ticketCode, checkedInAt: booking.checkedInAt, partySize: partySize(booking) }))
    const pendingApproval = await prisma.retreatBooking.count({ where: { retreatId, status: 'pending' } })

    return NextResponse.json({
      data: {
        bookings: bookings.length,
        bookingsArrived: arrived.length,
        guests: bookings.reduce((sum, booking) => sum + partySize(booking), 0),
        guestsArrived: arrived.reduce((sum, booking) => sum + partySize(booking), 0),
        pendingApproval,
        recent,
        expected: bookings
          .filter((booking) => !booking.attended)
          .map((booking) => ({ id: booking.id, fullName: booking.fullName, ticketCode: booking.ticketCode, phone: booking.phone, partySize: partySize(booking) }))
          .sort((a, b) => a.fullName.localeCompare(b.fullName)),
        updatedAt: new Date(),
      },
      retreats,
    })
  } catch (error) {
    console.error('[check-in][GET]', error)
    return NextResponse.json({ error: 'Unable to load check-in data.' }, { status: 500 })
  }
}
