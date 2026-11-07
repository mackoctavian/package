import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import prisma from '@/lib/prisma'
import { retreatData } from '@/app/data/retreats'
import { mapPrismaRetreat } from '@/app/api/retreats/utils'
import { mapPrismaBooking } from '@/app/api/retreats/bookings/utils'
import RetreatPayment from '@/app/components/Retreats/RetreatPayment'
import type { RetreatType } from '@/app/types/retreat'
import { localizeRecord } from '@/lib/i18n/content'
import { getT, setRequestLocale } from '@/i18n/server'
import { resolveLocale } from '@/i18n/page'
import { localizeHref } from '@/i18n/navigation'
import type { Locale } from '@/i18n/config'

type PageProps = {
  params: Promise<{ slug: string; locale: string }>
  searchParams: Promise<{ booking?: string }>
}

const loadRetreat = async (slug: string, locale: Locale): Promise<RetreatType | undefined> => {
  try {
    const record = await localizeRecord('retreat', await prisma.retreat.findUnique({ where: { slug } }), locale)
    if (record) {
      return mapPrismaRetreat(record)
    }
  } catch (error) {
    console.error('[retreat-payment] failed to load retreat', error)
  }

  return retreatData.find((item) => item.slug === slug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const t = await getT(locale)
  const retreat = await loadRetreat(slug, locale)
  return {
    title: retreat ? t('retreats.payment.metaTitle', { title: retreat.title }) : t('retreats.payment.metaFallback'),
    robots: { index: false },
  }
}

export default async function RetreatPaymentPage({ params, searchParams }: PageProps) {
  const locale = await resolveLocale(params)
  setRequestLocale(locale)
  const { slug } = await params
  const { booking: bookingId } = await searchParams
  if (!bookingId) {
    redirect(localizeHref(`/events/${slug}`, locale))
  }

  const [bookingRecord, retreat] = await Promise.all([
    prisma.retreatBooking
      .findUnique({ where: { id: bookingId } })
      .catch((error) => {
        console.error('[retreat-payment] failed to load booking', error)
        return null
      }),
    loadRetreat(slug, locale),
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
