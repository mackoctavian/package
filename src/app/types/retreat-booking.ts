export type RetreatBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'rescheduled' | 'attended' | 'no_show'

export type RetreatPaymentStatus = 'pending' | 'paid' | 'refunded' | 'waived'

export type RetreatBookingFamilyMember = {
  name: string
  relationship: string
  age: string
}

export interface RetreatBooking {
  id: string
  retreatId: string
  retreatTitle: string
  fullName: string
  email: string
  phone: string
  whatsapp?: string
  status: RetreatBookingStatus
  paymentStatus: RetreatPaymentStatus
  attended: boolean
  familyMembers: RetreatBookingFamilyMember[]
  notes?: string | null
  cancelledAt?: string | null
  rescheduledToRetreatId?: string | null
  rescheduledToRetreatTitle?: string | null
  rescheduledAt?: string | null
  createdAt: string
  updatedAt?: string
}

