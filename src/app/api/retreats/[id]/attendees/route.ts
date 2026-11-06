import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { guardAdminApi } from '@/lib/auth/api-guard'

// Get all attendees/bookings for a specific retreat
const getRetreatId = (request: Request, params?: { id?: string }) => {
  if (params?.id) return params.id
  const pathname = new URL(request.url).pathname
  const segments = pathname.split('/').filter(Boolean)
  return segments[segments.length - 2] ?? ''
}

export async function GET(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const denied = await guardAdminApi('retreats')
  if (denied) return denied

  try {
    const retreatId = getRetreatId(request, params)
    if (!retreatId) {
      return NextResponse.json({ error: 'Retreat id is required' }, { status: 400 })
    }

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








