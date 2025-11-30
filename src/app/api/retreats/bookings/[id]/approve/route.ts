import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(request: Request, { params }: { params: { id: string } }) {
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
        ticketCode,
      },
    })

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



