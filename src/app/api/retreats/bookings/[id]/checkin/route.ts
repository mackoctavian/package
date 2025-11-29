import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

    if (booking.attended) {
      return NextResponse.json({ 
        error: 'Already checked in',
        checkedInAt: booking.checkedInAt,
      }, { status: 400 })
    }

    // Update the booking to mark as attended
    const updated = await prisma.retreatBooking.update({
      where: { id: bookingId },
      data: {
        attended: true,
        checkedInAt: new Date(),
      },
    })

    return NextResponse.json({ 
      data: updated,
      message: 'Check-in successful',
    })
  } catch (error) {
    console.error('Error checking in booking:', error)
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
  }
}

// Undo check-in
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const bookingId = params.id

    const updated = await prisma.retreatBooking.update({
      where: { id: bookingId },
      data: {
        attended: false,
        checkedInAt: null,
      },
    })

    return NextResponse.json({ 
      data: updated,
      message: 'Check-in undone',
    })
  } catch (error) {
    console.error('Error undoing check-in:', error)
    return NextResponse.json({ error: 'Failed to undo check-in' }, { status: 500 })
  }
}

