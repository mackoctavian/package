import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { audit } from '@/lib/audit'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const auth = await requireAdminApiAccess('retreats', 'edit')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const bookingId = params.id

    // Get the booking
    const booking = await prisma.retreatBooking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Generate a unique ticket code if not already assigned
    const ticketCode = booking.ticketCode || `DMRC-${nanoid(8).toUpperCase()}`

    // Update the booking status to approved
    const updated = await prisma.retreatBooking.update({
      where: { id: bookingId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: auth.user.name,
        ticketCode,
      },
    })
    await audit({ actor: auth.user, action: 'approved', entity: 'booking', entityId: bookingId, summary: `Approved ${booking.fullName}'s booking for ${booking.retreatTitle}`, request })

    return NextResponse.json({ 
      data: updated,
      message: 'Booking approved successfully',
      ticketCode,
    })
  } catch (error) {
    console.error('Error approving booking:', error)
    return NextResponse.json({ error: 'Failed to approve booking' }, { status: 500 })
  }
}








