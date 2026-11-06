import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, CalendarDays, MapPin, Users2, Ticket, Download, QrCode } from 'lucide-react'

import prisma from '@/lib/prisma'
import { retreatData } from '@/app/data/retreats'
import { mapPrismaRetreat } from '@/app/api/retreats/utils'
import { mapPrismaBooking } from '@/app/api/retreats/bookings/utils'
import type { RetreatType } from '@/app/types/retreat'
import TicketDisplay from './TicketDisplay'

const buildTicketUrl = (code: string) => {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

  if (!base) {
    return `/retreats/check-booking?code=${encodeURIComponent(code)}`
  }

  return `${base.replace(/\/$/, '')}/retreats/check-booking?code=${encodeURIComponent(code)}`
}

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
    console.error('[retreat-payment-success] failed to load retreat', error)
  }

  return retreatData.find((item) => item.slug === slug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const retreat = await loadRetreat(slug)
  return {
    title: retreat ? `Booking Confirmed • ${retreat.title}` : 'Booking Confirmed',
  }
}

export default async function RetreatPaymentSuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { booking: bookingId } = await searchParams
  if (!bookingId) {
    redirect(`/events/${slug}`)
  }

  const [bookingRecord, retreat] = await Promise.all([
    prisma.retreatBooking
      .findUnique({ where: { id: bookingId } })
      .catch((error) => {
        console.error('[retreat-payment-success] failed to load booking', error)
        return null
      }),
    loadRetreat(slug),
  ])

  if (!bookingRecord || !retreat) {
    notFound()
  }

  const booking = mapPrismaBooking(bookingRecord)
  const ticketCode = (bookingRecord as any).ticketCode || `DMRC-${booking.id.slice(0, 8).toUpperCase()}`
  const ticketUrl = buildTicketUrl(ticketCode)

  return (
    <main className='py-16 sm:py-20'>
      <div className='container mx-auto max-w-4xl px-4'>
        {/* Success Message */}
        <div className='text-center mb-10'>
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6 shadow-lg shadow-emerald-200'>
            <CheckCircle2 className='h-10 w-10' />
          </div>
          <h1 className='mb-3 text-5xl text-navy-900'>Thank you — you're all set</h1>
          <p className='text-lg text-navy-700 max-w-xl mx-auto'>
            Your contribution has been submitted and your ticket is ready and a confirmation email has been sent to <strong>{booking.email}</strong>.
          </p>
        </div>

        {/* Ticket Display */}
        <div className='mb-10'>
          <TicketDisplay 
            booking={{
              id: booking.id,
              fullName: booking.fullName,
              email: booking.email,
              phone: booking.phone,
              ticketCode,
              status: booking.status,
            }}
            retreat={{
              title: retreat.title,
              dateRange: retreat.dateRange,
              timeRange: retreat.timeRange,
              location: retreat.location,
            }}
            ticketUrl={ticketUrl}
          />
        </div>

        {/* Important Info */}
        <div className='bg-white rounded-2xl border border-border p-6 mb-8 shadow-sm'>
          <h2 className='text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2'>
            <Ticket className='h-5 w-5 text-gold-700' />
            Important Information
          </h2>
          <ul className='space-y-3 text-navy-700'>
            <li className='flex items-start gap-3'>
              <div className='w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-sm font-bold flex-shrink-0'>1</div>
              <span>Please download or screenshot your ticket and bring it to the retreat.</span>
            </li>
            <li className='flex items-start gap-3'>
              <div className='w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-sm font-bold flex-shrink-0'>2</div>
              <span>Your QR code will be scanned at check-in for fast and contactless entry.</span>
            </li>
            <li className='flex items-start gap-3'>
              <div className='w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-sm font-bold flex-shrink-0'>3</div>
              <span>Arrive at least 30 minutes before the scheduled start time.</span>
            </li>
            <li className='flex items-start gap-3'>
              <div className='w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-sm font-bold flex-shrink-0'>4</div>
              <span>You can also check your booking status anytime using the "Check Booking" feature.</span>
            </li>
          </ul>
        </div>

        {/* Summary Cards */}
        <div className='grid gap-4 text-left sm:grid-cols-3 mb-8'>
          <div className='rounded-2xl border border-border bg-white px-5 py-4 shadow-sm'>
            <p className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
              <CalendarDays className='h-4 w-4 text-primary' /> Date
            </p>
            <p className='mt-2 text-base font-semibold text-navy-900'>{retreat.dateRange}</p>
            {retreat.timeRange && <p className='text-sm text-slate-500'>{retreat.timeRange}</p>}
          </div>
          <div className='rounded-2xl border border-border bg-white px-5 py-4 shadow-sm'>
            <p className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
              <MapPin className='h-4 w-4 text-primary' /> Venue
            </p>
            <p className='mt-2 text-base font-semibold text-navy-900'>{retreat.location}</p>
          </div>
          <div className='rounded-2xl border border-border bg-white px-5 py-4 shadow-sm'>
            <p className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
              <Users2 className='h-4 w-4 text-primary' /> Guest
            </p>
            <p className='mt-2 text-base font-semibold text-navy-900'>{booking.fullName}</p>
            <p className='text-sm text-slate-500'>Booking #{booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-wrap items-center justify-center gap-3 text-sm'>
          <Link 
            href='/retreats/check-booking' 
            className='inline-flex items-center gap-2 rounded-xl border border-border bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary shadow-sm'
          >
            <QrCode className='h-4 w-4' />
            Check Booking Status
          </Link>
          <Link href='/' className='inline-flex items-center gap-2 rounded-xl border border-border bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary shadow-sm'>
            Return Home
          </Link>
          <Link
            href={`/events/${slug}`}
            className='inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90'>
            View Retreat Details
          </Link>
        </div>
      </div>
    </main>
  )
}
