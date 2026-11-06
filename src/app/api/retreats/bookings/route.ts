import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

import prisma from '@/lib/prisma'
import { retreatBookingPayloadSchema } from '@/lib/validators/retreat'
import { sendRetreatBookingEmail } from '@/lib/email/retreat-booking'
import { mapPrismaBooking } from './utils'
import { guardAdminApi, isAdminRequest } from '@/lib/auth/api-guard'

const normalizePhone = (value?: string | null) => value?.replace(/\s+/g, '') ?? undefined

const generateTicketCode = () => `DMRC-${nanoid(8).toUpperCase()}`

export const GET = async () => {
  const denied = await guardAdminApi('retreats')
  if (denied) return denied

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

  const { retreatId, form, note } = parsed.data

  try {
    const retreat = await prisma.retreat.findUnique({
      where: { id: retreatId },
      select: { id: true, title: true, status: true, isPaid: true },
    })
    if (!retreat) {
      return NextResponse.json({ error: 'This retreat could not be found.' }, { status: 404 })
    }
    const isAdmin = await isAdminRequest('retreats')
    if (retreat.status === 'Closed' && !isAdmin) {
      return NextResponse.json({ error: 'Registration for this retreat is closed.' }, { status: 409 })
    }

    // Payment status is decided by the server: the public form cannot mark a booking as paid.
    const paymentStatus =
      isAdmin && parsed.data.paymentStatus ? parsed.data.paymentStatus : retreat.isPaid === false ? 'waived' : 'pending'

    // Generate a unique ticket code
    const ticketCode = generateTicketCode()

    const created = await prisma.retreatBooking.create({
      data: {
        retreatId: retreat.id,
        retreatTitle: retreat.title,
        fullName: form.fullName,
        email: form.email,
        phone: normalizePhone(form.phone) ?? form.phone,
        whatsapp: normalizePhone(form.whatsapp) ?? form.whatsapp,
        status: 'pending',
        paymentStatus,
        attended: false,
        ticketCode,
        familyMembers: form.familyMembers ?? [],
        formPayload: form,
        notes: isAdmin ? note : undefined,
      },
    })

    // Best-effort: send confirmation email (do not fail booking if email fails)
    sendRetreatBookingEmail({ bookingId: created.id, kind: 'created' }).catch((error) => {
      console.error('[retreat-bookings][POST] email failed:', error)
    })

    return NextResponse.json({ data: mapPrismaBooking(created), ticketCode }, { status: 201 })
  } catch (error) {
    console.error('[retreat-bookings][POST] Prisma error:', error)
    return NextResponse.json({ error: 'Unable to create booking.' }, { status: 500 })
  }
}

