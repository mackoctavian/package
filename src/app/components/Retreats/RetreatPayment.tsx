'use client'

import { Link, useLocalizedRouter } from '@/i18n/link'
import { useLocale, useT } from '@/i18n/client'
import { localizeDateRange } from '@/lib/retreats/dates'
import { CalendarDays, MapPin, ShieldCheck } from 'lucide-react'

import MockCheckout from '@/app/components/giving/MockCheckout'
import { Button } from '@/app/components/ui/button'
import type { RetreatType } from '@/app/types/retreat'
import type { RetreatBooking } from '@/app/types/retreat-booking'

interface RetreatPaymentProps {
  retreat: RetreatType
  booking: RetreatBooking
}

/** Contribution checkout for a retreat booking. Uses the demo checkout until a provider is live. */
export default function RetreatPayment({ retreat, booking }: RetreatPaymentProps) {
  const router = useLocalizedRouter()
  const t = useT()
  const locale = useLocale()
  const successHref = `/retreats/${retreat.slug}/payment/success?booking=${booking.id}`
  const free = retreat.isPaid === false || !retreat.price
  const people = 1 + (booking.familyMembers?.filter((member) => member?.name)?.length ?? 0)
  const amount = (retreat.price ?? 0) * people

  return (
    <div className='grid gap-8 lg:grid-cols-5'>
      <aside className='space-y-4 lg:col-span-2'>
        <div className='rounded-[2rem] bg-navy-900 p-6 text-white'>
          <p className='eyebrow text-gold-300'>{t('retreats.payment.yourBooking')}</p>
          <h2 className='mt-3 font-display text-3xl font-semibold text-white'>{retreat.title}</h2>
          <ul className='mt-5 space-y-2 text-sm text-navy-100'>
            <li className='flex items-center gap-2'>
              <CalendarDays className='h-4 w-4 text-gold-300' /> {localizeDateRange(retreat.dateRange, locale)}
            </li>
            <li className='flex items-center gap-2'>
              <MapPin className='h-4 w-4 text-gold-300' /> {retreat.location}
            </li>
          </ul>
          <dl className='mt-6 space-y-2 border-t border-white/10 pt-5 text-sm'>
            <div className='flex justify-between'>
              <dt className='text-navy-200'>{t('retreats.payment.guest')}</dt>
              <dd>{booking.fullName}</dd>
            </div>
            <div className='flex justify-between'>
              <dt className='text-navy-200'>{t('retreats.payment.people')}</dt>
              <dd>{people}</dd>
            </div>
            {booking.ticketCode && (
              <div className='flex justify-between'>
                <dt className='text-navy-200'>{t('retreats.payment.ticket')}</dt>
                <dd className='font-mono'>{booking.ticketCode}</dd>
              </div>
            )}
          </dl>
        </div>
      </aside>

      <div className='rounded-[2rem] border border-border bg-white p-6 shadow-soft sm:p-8 lg:col-span-3'>
        <h1 className='font-display text-4xl font-semibold text-navy-900'>{t('retreats.payment.title')}</h1>
        <div className='mt-6'>
          {free ? (
            <div className='rounded-2xl bg-emerald-50 p-6 text-emerald-800'>
              <ShieldCheck className='h-6 w-6' />
              <p className='mt-3 font-semibold'>{t('retreats.payment.freeTitle')}</p>
              <p className='mt-1 text-sm'>{t('retreats.payment.freeText')}</p>
              <Button asChild className='mt-5' size='pill'>
                <Link href={successHref}>{t('retreats.payment.viewTicket')}</Link>
              </Button>
            </div>
          ) : (
            <MockCheckout
              amount={amount}
              reference={booking.ticketCode ?? booking.id.slice(0, 8).toUpperCase()}
              description={t('retreats.payment.description', { count: people })}
              defaultPhone={booking.phone}
              onPaid={() => router.push(successHref)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
