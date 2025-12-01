import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Get all attendees/bookings for a specific retreat
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const retreatId = params.id

    // Get retreat details
    const retreat = await prisma.retreat.findUnique({
      where: { id: retreatId },
    })

    if (!retreat) {
      return NextResponse.json({ error: 'Retreat not found' }, { status: 404 })
    }

    // Get all bookings for this retreat
    const bookings = await prisma.retreatBooking.findMany({
      where: { retreatId },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate stats
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      approved: bookings.filter(b => b.status === 'approved').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      attended: bookings.filter(b => b.attended).length,
      paid: bookings.filter(b => b.paymentStatus === 'paid').length,
    }

    return NextResponse.json({ 
      data: bookings,
      retreat: {
        id: retreat.id,
        title: retreat.title,
        dateRange: retreat.dateRange,
        location: retreat.location,
        availabilityTotal: retreat.availabilityTotal,
      },
      stats,
    })
  } catch (error) {
    console.error('Error fetching attendees:', error)
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 })
  }
}





