import { Retreat, type RetreatBooking as PrismaRetreatBooking } from '@prisma/client'

import { RetreatType } from '@/app/types/retreat'
import { mapPrismaBooking } from '@/app/api/retreats/bookings/utils'

type PrismaRetreatWithRelations = Retreat & {
  bookings?: PrismaRetreatBooking[]
}

export const mapPrismaRetreat = (retreat: PrismaRetreatWithRelations): RetreatType => ({
  id: retreat.id,
  slug: retreat.slug,
  title: retreat.title,
  subtitle: retreat.subtitle ?? undefined,
  speaker: retreat.speaker,
  conductor: retreat.conductor,
  description: retreat.description,
  dateRange: retreat.dateRange,
  timeRange: retreat.timeRange,
  location: retreat.location,
  availability: {
    total: retreat.availabilityTotal ?? 0,
    male: retreat.availabilityMale ?? 0,
    female: retreat.availabilityFemale ?? 0,
  },
  status: (retreat.status as RetreatType['status']) ?? 'Registration Open',
  imageSrc: retreat.imageSrc ?? '/images/courses/coursesOne.svg',
  category: (retreat.category as RetreatType['category']) ?? 'mission',
  detailHref: retreat.detailHref ?? `/events/${retreat.slug}`,
  ctaHref: retreat.ctaHref ?? `/events/${retreat.slug}#booking`,
  price: retreat.price ?? undefined,
  isPaid: retreat.isPaid ?? undefined,
  bookings: retreat.bookings ? retreat.bookings.map(mapPrismaBooking) : undefined,
})

