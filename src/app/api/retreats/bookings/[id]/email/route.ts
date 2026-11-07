import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { sendRetreatBookingEmail, type RetreatBookingEmailKind } from '@/lib/email/retreat-booking'
import { guardAdminApi } from '@/lib/auth/api-guard'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise
  const denied = await guardAdminApi('retreats', 'edit')
  if (denied) return denied

  try {
    const body = await request.json().catch(() => ({}))
    const ticketCode = typeof body?.ticketCode === 'string' ? body.ticketCode.trim() : ''
    const kind: RetreatBookingEmailKind =
      body?.kind === 'rescheduled' ? 'rescheduled' : 'created'

    if (!ticketCode) {
      return NextResponse.json({ error: 'ticketCode is required.' }, { status: 400 })
    }

    const booking = await prisma.retreatBooking.findUnique({
      where: { id: params.id },
      select: { id: true, ticketCode: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }

    if (!booking.ticketCode || booking.ticketCode !== ticketCode) {
      return NextResponse.json({ error: 'Invalid ticket code.' }, { status: 401 })
    }

    const result = await sendRetreatBookingEmail({ bookingId: booking.id, kind })
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[retreat-booking-email][POST]', error)
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 })
  }
}

