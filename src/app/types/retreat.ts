export type RetreatCategory = 'all' | 'residential' | 'parish' | 'special' | 'jesus-mission'

export type RetreatStatus = 'Registration Open' | 'Waitlist' | 'Closed'

export interface RetreatAvailability {
  total: number
  male: number
  female: number
}

import type { RetreatBooking } from '@/app/types/retreat-booking'

export interface RetreatType {
  id: string
  slug: string
  title: string
  subtitle?: string
  speaker: string
  conductor: string
  description: string
  dateRange: string
  timeRange: string
  location: string
  availability: RetreatAvailability
  status: RetreatStatus
  imageSrc: string
  category: RetreatCategory
  detailHref: string
  ctaHref: string
  price?: number
  isPaid?: boolean
  bookings?: RetreatBooking[]
}

