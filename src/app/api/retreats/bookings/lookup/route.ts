import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { mapPrismaBooking } from '../utils'

type LookupRequest = {
  bookingId?: string
  fullName?: string
  phone?: string
}

const normalizePhone = (value?: string | null) => value?.replace(/\s+/g, '') ?? ''

export const POST = async (request: Request) => {
  const body = (await request.json()) as LookupRequest
  const bookingId = body.bookingId?.trim()
  const fullName = body.fullName?.trim()
  const rawPhone = body.phone?.trim()
  const phone = normalizePhone(body.phone)
  const phoneFilters = Array.from(new Set([rawPhone, phone].filter(Boolean))).map((value) => ({
    phone: { equals: value! },
  }))
  const whereClauses = [{ fullName: { equals: fullName!, mode: 'insensitive' } }] as Record<string, unknown>[]
  if (phoneFilters.length) {
    whereClauses.push({ OR: phoneFilters })
  }

  if (!bookingId && !(fullName && phone)) {
    return NextResponse.json(
      { error: 'Provide a booking ID or both full name and phone number.' },
      { status: 400 },
    )
  }

  try {
    const record = bookingId
      ? await prisma.retreatBooking.findUnique({ where: { id: bookingId } })
      : await prisma.retreatBooking.findFirst({
          where: {
            AND: whereClauses,
          },
        })

    if (!record) {
      return NextResponse.json({ error: 'No booking matched those details.' }, { status: 404 })
    }

    return NextResponse.json({ data: mapPrismaBooking(record) })
  } catch (error) {
    console.error('[retreat-bookings][lookup][POST]', error)
    return NextResponse.json({ error: 'Unable to locate booking right now.' }, { status: 500 })
  }
}

