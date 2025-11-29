import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { mapPrismaBooking } from '../utils'

type RouteContext = {
  params: { id: string }
}

export const GET = async (_request: Request, { params }: RouteContext) => {
  try {
    const record = await prisma.retreatBooking.findUnique({
      where: { id: params.id },
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
  const body = await request.json()
  const { status, paymentStatus, attended, notes, retreatId, retreatTitle } = body
  const updates: Record<string, unknown> = {}

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
      where: { id: params.id },
      data: updates,
    })

    return NextResponse.json({ data: mapPrismaBooking(updated) })
  } catch (error) {
    console.error('[retreat-bookings][PATCH] Prisma error:', error)
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  }
}

