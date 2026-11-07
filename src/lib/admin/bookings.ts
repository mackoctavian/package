import type { Prisma, RetreatBooking } from '@prisma/client'

export const BOOKING_STATUSES = ['pending', 'approved', 'rescheduled', 'cancelled'] as const
export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'] as const

/** Number of people a booking covers: the guest plus listed family members. */
export const partySize = (booking: Pick<RetreatBooking, 'familyMembers'>) =>
  1 + (Array.isArray(booking.familyMembers) ? booking.familyMembers.length : 0)

export type BookingFilters = {
  retreatId?: string
  status?: string
  payment?: string
  attended?: 'yes' | 'no'
  q?: string
}

export const parseBookingFilters = (params: URLSearchParams): BookingFilters => {
  const value = (key: string) => {
    const raw = params.get(key)?.trim()
    return raw && raw !== 'all' ? raw : undefined
  }
  const attended = value('attended')
  return {
    retreatId: value('retreatId'),
    status: value('status'),
    payment: value('payment'),
    attended: attended === 'yes' || attended === 'no' ? attended : undefined,
    q: value('q'),
  }
}

export const bookingWhere = (filters: BookingFilters): Prisma.RetreatBookingWhereInput => ({
  ...(filters.retreatId && { retreatId: filters.retreatId }),
  ...(filters.status && { status: filters.status }),
  ...(filters.payment && { paymentStatus: filters.payment }),
  ...(filters.attended && { attended: filters.attended === 'yes' }),
  ...(filters.q && {
    OR: ['fullName', 'email', 'phone', 'ticketCode', 'retreatTitle'].map((field) => ({
      [field]: { contains: filters.q, mode: 'insensitive' as const },
    })),
  }),
})

/** Normalises what a scanner reads: a bare code, or a ticket URL containing `?code=`. */
export const extractTicketCode = (raw: string) => {
  const text = raw.trim()
  try {
    const url = new URL(text)
    const code = url.searchParams.get('code')
    if (code) return code.trim().toUpperCase()
  } catch {
    // Not a URL; treat as a code.
  }
  return text.toUpperCase()
}
