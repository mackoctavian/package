import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { mapPrismaRetreat } from '../utils'
import { retreatUpdateSchema } from '@/lib/validators/retreat'

type RouteContext = {
  params: { id: string }
}

export const GET = async (_request: Request, { params }: RouteContext) => {
  try {
    const record = await prisma.retreat.findUnique({
      where: { id: params.id },
      include: { bookings: true },
    })

    if (!record) {
      return NextResponse.json({ error: 'Retreat not found.' }, { status: 404 })
    }

    return NextResponse.json({ data: mapPrismaRetreat(record) })
  } catch (error) {
    console.error('[retreats][GET:id] Prisma error:', error)
    return NextResponse.json({ error: 'Unable to load retreat.' }, { status: 500 })
  }
}

export const PATCH = async (request: Request, { params }: RouteContext) => {
  const json = await request.json()
  const parsed = retreatUpdateSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const body = parsed.data
  const updates: Record<string, unknown> = {}

  ;(
    [
      'slug',
      'title',
      'subtitle',
      'speaker',
      'conductor',
      'description',
      'dateRange',
      'timeRange',
      'location',
      'status',
      'imageSrc',
      'category',
      'detailHref',
      'ctaHref',
      'price',
      'isPaid',
    ] as const
  ).forEach((key) => {
    if (key in body) {
      updates[key] = body[key]
    }
  })

  if (body.availability) {
    updates.availabilityTotal = body.availability.total ?? 0
    updates.availabilityMale = body.availability.male ?? 0
    updates.availabilityFemale = body.availability.female ?? 0
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 })
  }

  try {
    const updated = await prisma.retreat.update({
      where: { id: params.id },
      data: updates,
      include: { bookings: true },
    })

    return NextResponse.json({ data: mapPrismaRetreat(updated) })
  } catch (error) {
    console.error('[retreats][PATCH] Prisma error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Retreat not found.' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  }
}

export const DELETE = async (_request: Request, { params }: RouteContext) => {
  try {
    await prisma.retreat.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[retreats][DELETE] Prisma error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Retreat not found.' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Delete failed.' }, { status: 500 })
  }
}

