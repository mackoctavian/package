import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { extractTicketCode, partySize } from '@/lib/admin/bookings'
import { guardAnyAdminApi } from '@/lib/auth/api-guard'

const retreatSelect = { select: { id: true, title: true, dateRange: true, location: true } } as const

const findBooking = (input: { ticketCode?: string; bookingId?: string }) =>
  input.bookingId
    ? prisma.retreatBooking.findUnique({ where: { id: input.bookingId }, include: { retreat: retreatSelect } })
    : prisma.retreatBooking.findUnique({ where: { ticketCode: input.ticketCode! }, include: { retreat: retreatSelect } })

type FoundBooking = NonNullable<Awaited<ReturnType<typeof findBooking>>>

const summary = (booking: FoundBooking) => ({
  id: booking.id,
  fullName: booking.fullName,
  email: booking.email,
  phone: booking.phone,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  ticketCode: booking.ticketCode,
  partySize: partySize(booking),
  retreat: booking.retreat,
})

/**
 * Checks a guest in from a scanned or typed ticket code (or a booking id
 * picked from the expected-guests list). Optional `retreatId` flags tickets
 * for a different retreat. `undo: true` reverses a check-in.
 */
export async function POST(request: Request) {
  const access = await guardAnyAdminApi([
    ['retreats', 'edit'],
    ['check-in', 'edit'],
  ])
  if ('denied' in access) return access.denied

  try {
    const body = await request.json().catch(() => ({}))
    const ticketCode = typeof body?.ticketCode === 'string' && body.ticketCode.trim() ? extractTicketCode(body.ticketCode) : undefined
    const bookingId = typeof body?.bookingId === 'string' ? body.bookingId : undefined
    const retreatId = typeof body?.retreatId === 'string' ? body.retreatId : undefined

    if (!ticketCode && !bookingId) {
      return NextResponse.json({ error: 'Ticket code is required', valid: false }, { status: 400 })
    }

    const booking = await findBooking({ ticketCode, bookingId })
    if (!booking) {
      return NextResponse.json({ error: 'No booking matches this ticket.', valid: false }, { status: 404 })
    }

    if (body?.undo === true) {
      await prisma.retreatBooking.update({ where: { id: booking.id }, data: { attended: false, checkedInAt: null } })
      await audit({ actor: access.user, action: 'updated', entity: 'booking', entityId: booking.id, summary: `Undid check-in for ${booking.fullName}`, request })
      return NextResponse.json({ message: 'Check-in undone', valid: true, booking: summary(booking) })
    }

    if (retreatId && booking.retreatId !== retreatId) {
      return NextResponse.json(
        { error: `This ticket is for ${booking.retreat.title}.`, valid: false, wrongRetreat: true, booking: summary(booking) },
        { status: 409 },
      )
    }

    if (booking.status !== 'approved') {
      const reason = booking.status === 'cancelled' ? 'This booking was cancelled.' : 'This booking has not been approved yet.'
      return NextResponse.json({ error: reason, valid: false, booking: summary(booking) }, { status: 400 })
    }

    if (booking.attended) {
      return NextResponse.json({
        message: 'Already checked in',
        valid: true,
        alreadyCheckedIn: true,
        checkedInAt: booking.checkedInAt,
        booking: summary(booking),
      })
    }

    // Conditional update so two scanners scanning the same ticket can't both "win".
    const checkedInAt = new Date()
    const result = await prisma.retreatBooking.updateMany({
      where: { id: booking.id, attended: false },
      data: { attended: true, checkedInAt },
    })
    if (!result.count) {
      const latest = await prisma.retreatBooking.findUnique({ where: { id: booking.id }, select: { checkedInAt: true } })
      return NextResponse.json({ message: 'Already checked in', valid: true, alreadyCheckedIn: true, checkedInAt: latest?.checkedInAt, booking: summary(booking) })
    }

    await audit({
      actor: access.user,
      action: 'checked_in',
      entity: 'booking',
      entityId: booking.id,
      summary: `Checked in ${booking.fullName} (${partySize(booking)}) for ${booking.retreat.title}`,
      request,
    })

    return NextResponse.json({ message: 'Check-in successful', valid: true, alreadyCheckedIn: false, checkedInAt, booking: summary(booking) })
  } catch (error) {
    console.error('Error scanning ticket:', error)
    return NextResponse.json({ error: 'Failed to process scan' }, { status: 500 })
  }
}

// Look up a ticket without checking in.
export async function GET(request: Request) {
  const access = await guardAnyAdminApi([
    ['retreats', 'view'],
    ['check-in', 'view'],
  ])
  if ('denied' in access) return access.denied

  const raw = new URL(request.url).searchParams.get('code')
  if (!raw) return NextResponse.json({ error: 'Ticket code is required' }, { status: 400 })

  try {
    const booking = await findBooking({ ticketCode: extractTicketCode(raw) })
    if (!booking) return NextResponse.json({ error: 'Invalid ticket code', valid: false }, { status: 404 })
    return NextResponse.json({
      valid: true,
      booking: { ...summary(booking), attended: booking.attended, checkedInAt: booking.checkedInAt },
    })
  } catch (error) {
    console.error('Error looking up ticket:', error)
    return NextResponse.json({ error: 'Failed to lookup ticket' }, { status: 500 })
  }
}
