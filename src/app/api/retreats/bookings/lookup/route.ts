import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { mapPrismaBooking } from '../utils'

type LookupRequest = {
  bookingId?: string
}

export const POST = async (request: Request) => {
  const body = (await request.json()) as LookupRequest
  const bookingId = body.bookingId?.trim()

  if (!bookingId) {
    return NextResponse.json({ error: 'Please provide your booking ID.' }, { status: 400 })
  }

  try {
    const normalizedCode = bookingId.toUpperCase()
    const record = await prisma.retreatBooking.findFirst({
          where: {
        OR: [
          { id: bookingId },
          { ticketCode: bookingId },
          { ticketCode: normalizedCode },
        ],
          },
        })

    if (!record) {
      return NextResponse.json({ error: 'No booking matched that ID.' }, { status: 404 })
    }

    return NextResponse.json({ data: mapPrismaBooking(record) })
  } catch (error) {
    console.error('[retreat-bookings][lookup][POST]', error)
    return NextResponse.json({ error: 'Unable to locate booking right now.' }, { status: 500 })
  }
}

