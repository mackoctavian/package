import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import prisma from '@/lib/prisma'
import { retreatData } from '@/app/data/retreats'
import { mapPrismaRetreat } from '@/app/api/retreats/utils'
import { mapPrismaBooking } from '@/app/api/retreats/bookings/utils'
import RetreatPayment from '@/app/components/Retreats/RetreatPayment'
import type { RetreatType } from '@/app/types/retreat'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ booking?: string }>
}

const loadRetreat = async (slug: string): Promise<RetreatType | undefined> => {
  try {
    const record = await prisma.retreat.findUnique({ where: { slug } })
    if (record) {
      return mapPrismaRetreat(record)
    }
  } catch (error) {
    console.error('[retreat-payment] failed to load retreat', error)
  }

  return retreatData.find((item) => item.slug === slug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const retreat = await loadRetreat(slug)
  return {
    title: retreat ? `Complete payment • ${retreat.title}` : 'Retreat payment',
  }
}

export default async function RetreatPaymentPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { booking: bookingId } = await searchParams
  if (!bookingId) {
    redirect(`/events/${slug}`)
  }

  const [bookingRecord, retreat] = await Promise.all([
    prisma.retreatBooking
      .findUnique({ where: { id: bookingId } })
      .catch((error) => {
        console.error('[retreat-payment] failed to load booking', error)
        return null
      }),
    loadRetreat(slug),
  ])

  if (!bookingRecord || !retreat) {
    notFound()
  }

  const booking = mapPrismaBooking(bookingRecord)

  return (
    <main className='py-12 sm:py-16'>
      <div className='container max-w-5xl'>
        <RetreatPayment retreat={retreat} booking={booking} />
      </div>
    </main>
  )
}
