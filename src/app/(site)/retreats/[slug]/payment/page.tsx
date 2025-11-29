import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import prisma from '@/lib/prisma'
import { retreatData } from '@/app/data/retreats'
import { mapPrismaRetreat } from '@/app/api/retreats/utils'
import { mapPrismaBooking } from '@/app/api/retreats/bookings/utils'
import RetreatPayment from '@/app/components/Retreats/RetreatPayment'
import type { RetreatType } from '@/app/types/retreat'

type PageProps = {
  params: { slug: string }
  searchParams: { booking?: string }
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
  const retreat = await loadRetreat(params.slug)
  return {
    title: retreat ? `Complete payment • ${retreat.title}` : 'Retreat payment',
  }
}

export default async function RetreatPaymentPage({ params, searchParams }: PageProps) {
  const bookingId = searchParams.booking
  if (!bookingId) {
    redirect(`/events/${params.slug}`)
  }

  const [bookingRecord, retreat] = await Promise.all([
    prisma.retreatBooking
      .findUnique({ where: { id: bookingId } })
      .catch((error) => {
        console.error('[retreat-payment] failed to load booking', error)
        return null
      }),
    loadRetreat(params.slug),
  ])

  if (!bookingRecord || !retreat) {
    notFound()
  }

  const booking = mapPrismaBooking(bookingRecord)

  return (
    <main className='bg-slate-50 py-16 sm:py-20'>
      <div className='container mx-auto max-w-4xl px-4'>
        <RetreatPayment retreat={retreat} booking={booking} />
      </div>
    </main>
  )
}
