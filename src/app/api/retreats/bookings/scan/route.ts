import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Scan QR code and check in user
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ticketCode } = body

    if (!ticketCode) {
      return NextResponse.json({ error: 'Ticket code is required' }, { status: 400 })
    }

    // Find booking by ticket code
    const booking = await prisma.retreatBooking.findUnique({
      where: { ticketCode },
      include: {
        retreat: {
          select: {
            id: true,
            title: true,
            dateRange: true,
            location: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ 
        error: 'Invalid ticket code',
        valid: false,
      }, { status: 404 })
    }

    // Check if booking is approved
    if (booking.status !== 'approved') {
      return NextResponse.json({ 
        error: 'Booking not approved',
        valid: false,
        booking: {
          id: booking.id,
          fullName: booking.fullName,
          status: booking.status,
          retreat: booking.retreat,
        },
      }, { status: 400 })
    }

    // Check if already checked in
    if (booking.attended) {
      return NextResponse.json({ 
        message: 'Already checked in',
        valid: true,
        alreadyCheckedIn: true,
        checkedInAt: booking.checkedInAt,
        booking: {
          id: booking.id,
          fullName: booking.fullName,
          email: booking.email,
          phone: booking.phone,
          status: booking.status,
          retreat: booking.retreat,
        },
      })
    }

    // Check in the user
    const updated = await prisma.retreatBooking.update({
      where: { id: booking.id },
      data: {
        attended: true,
        checkedInAt: new Date(),
      },
      include: {
        retreat: {
          select: {
            id: true,
            title: true,
            dateRange: true,
            location: true,
          },
        },
      },
    })

    return NextResponse.json({ 
      message: 'Check-in successful',
      valid: true,
      alreadyCheckedIn: false,
      checkedInAt: updated.checkedInAt,
      booking: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        status: updated.status,
        retreat: updated.retreat,
      },
    })
  } catch (error) {
    console.error('Error scanning ticket:', error)
    return NextResponse.json({ error: 'Failed to process scan' }, { status: 500 })
  }
}

// Lookup ticket info without checking in
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketCode = searchParams.get('code')

    if (!ticketCode) {
      return NextResponse.json({ error: 'Ticket code is required' }, { status: 400 })
    }

    const booking = await prisma.retreatBooking.findUnique({
      where: { ticketCode },
      include: {
        retreat: {
          select: {
            id: true,
            title: true,
            dateRange: true,
            location: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ 
        error: 'Invalid ticket code',
        valid: false,
      }, { status: 404 })
    }

    return NextResponse.json({ 
      valid: true,
      booking: {
        id: booking.id,
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        status: booking.status,
        attended: booking.attended,
        checkedInAt: booking.checkedInAt,
        ticketCode: booking.ticketCode,
        retreat: booking.retreat,
      },
    })
  } catch (error) {
    console.error('Error looking up ticket:', error)
    return NextResponse.json({ error: 'Failed to lookup ticket' }, { status: 500 })
  }
}








