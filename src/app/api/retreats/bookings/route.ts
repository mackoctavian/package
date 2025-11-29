import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

import prisma from '@/lib/prisma'
import { retreatBookingPayloadSchema } from '@/lib/validators/retreat'
import { mapPrismaBooking } from './utils'

const normalizePhone = (value?: string | null) => value?.replace(/\s+/g, '') ?? undefined

const generateTicketCode = () => `DMRC-${nanoid(8).toUpperCase()}`

export const GET = async () => {
  try {
    const records = await prisma.retreatBooking.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: records.map(mapPrismaBooking) })
  } catch (error) {
    console.error('[retreat-bookings][GET] Prisma error:', error)
    return NextResponse.json({ error: 'Unable to load bookings.' }, { status: 500 })
  }
}

export const POST = async (request: Request) => {
  const json = await request.json()
  const parsed = retreatBookingPayloadSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { retreatId, retreatTitle, form, note, paymentStatus } = parsed.data

  try {
    // Generate a unique ticket code
    const ticketCode = generateTicketCode()

    const created = await prisma.retreatBooking.create({
      data: {
        retreatId,
        retreatTitle,
        fullName: form.fullName,
        email: form.email,
        phone: normalizePhone(form.phone) ?? form.phone,
        whatsapp: normalizePhone(form.whatsapp) ?? form.whatsapp,
        status: 'pending',
        paymentStatus: paymentStatus ?? 'pending',
        attended: false,
        ticketCode,
        familyMembers: form.familyMembers ?? [],
        formPayload: form,
        notes: note,
      },
    })

    return NextResponse.json({ data: mapPrismaBooking(created), ticketCode }, { status: 201 })
  } catch (error) {
    console.error('[retreat-bookings][POST] Prisma error:', error)
    return NextResponse.json({ error: 'Unable to create booking.' }, { status: 500 })
  }
}

