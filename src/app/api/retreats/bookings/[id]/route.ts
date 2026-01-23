import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { mapPrismaBooking } from '../utils'
import { sendRetreatBookingEmail } from '@/lib/email/retreat-booking'

type RouteContext = {
  params: { id: string }
}

const getBookingId = (request: Request, params?: RouteContext['params']) => {
  if (params?.id) return params.id
  const pathname = new URL(request.url).pathname
  const segments = pathname.split('/').filter(Boolean)
  return segments[segments.length - 1] ?? ''
}

export const GET = async (request: Request, { params }: RouteContext) => {
  try {
    const bookingId = getBookingId(request, params)
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking id is required.' }, { status: 400 })
    }

    const record = await prisma.retreatBooking.findUnique({
      where: { id: bookingId },
    })

    if (!record) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }

    return NextResponse.json({ data: mapPrismaBooking(record) })
  } catch (error) {
    console.error('[retreat-bookings][GET:id] Prisma error:', error)
    return NextResponse.json({ error: 'Unable to load booking.' }, { status: 500 })
  }
}

export const PATCH = async (request: Request, { params }: RouteContext) => {
  const bookingId = getBookingId(request, params)
  if (!bookingId) {
    return NextResponse.json({ error: 'Booking id is required.' }, { status: 400 })
  }

  const body = await request.json()
  const { status, paymentStatus, attended, notes, retreatId, retreatTitle } = body
  const updates: Record<string, unknown> = {}
  const isReschedule = Boolean(retreatId)

  if (status) {
    updates.status = status
    updates.cancelledAt = status === 'cancelled' ? new Date() : null
  }

  if (paymentStatus) {
    updates.paymentStatus = paymentStatus
  }

  if (typeof attended === 'boolean') {
    updates.attended = attended
  }

  if (notes !== undefined) {
    updates.notes = notes
  }

  if (retreatId) {
    updates.retreatId = retreatId
    updates.retreatTitle = retreatTitle ?? null
    updates.rescheduledToRetreatId = retreatId
    updates.rescheduledToRetreatTitle = retreatTitle ?? null
    updates.rescheduledAt = new Date()
    if (!status) {
      updates.status = 'rescheduled'
    }
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 })
  }

  updates.updatedAt = new Date()

  try {
    const updated = await prisma.retreatBooking.update({
      where: { id: bookingId },
      data: updates,
    })

    // Best-effort: send reschedule confirmation email if this update changed the retreat
    if (isReschedule) {
      sendRetreatBookingEmail({ bookingId: updated.id, kind: 'rescheduled' }).catch((error) => {
        console.error('[retreat-bookings][PATCH] email failed:', error)
      })
    }

    return NextResponse.json({ data: mapPrismaBooking(updated) })
  } catch (error) {
    console.error('[retreat-bookings][PATCH] Prisma error:', error)
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  }
}

