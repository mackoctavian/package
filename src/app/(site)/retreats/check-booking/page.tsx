'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CalendarDays, CheckCircle2, Clock, Loader2, MapPin, RefreshCw, Search, Ticket, XCircle } from 'lucide-react'

import RetreatTicket from '@/app/components/Retreats/RetreatTicket'
import { Button } from '@/app/components/ui/button'
import type { RetreatBooking } from '@/app/types/retreat-booking'
import type { RetreatType } from '@/app/types/retreat'
import { getUpcomingRetreats } from '@/lib/retreats/dates'
import { cn } from '@/lib/utils'

type Message = { type: 'success' | 'error'; text: string } | null

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'Awaiting approval', className: 'bg-amber-50 text-amber-800 ring-amber-600/20', icon: Clock },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: CheckCircle2 },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 ring-red-600/20', icon: XCircle },
  rescheduled: { label: 'Rescheduled', className: 'bg-sky-50 text-sky-700 ring-sky-600/20', icon: RefreshCw },
}

const paymentLabels: Record<string, string> = {
  pending: 'Contribution pending',
  paid: 'Contribution received',
  partial: 'Partially paid',
  refunded: 'Refunded',
  waived: 'No payment needed',
}

function CheckBookingContent() {
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [booking, setBooking] = useState<RetreatBooking | null>(null)
  const [retreats, setRetreats] = useState<RetreatType[]>([])
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'cancel' | 'reschedule' | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [rescheduleTo, setRescheduleTo] = useState('')
  const [message, setMessage] = useState<Message>(null)
  const autoLookup = useRef<string | null>(null)

  const lookup = useCallback(async (raw: string) => {
    const value = raw.trim()
    if (!value) {
      setMessage({ type: 'error', text: 'Please enter the ticket code from your confirmation email.' })
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/retreats/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: value }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error ?? 'We could not find that booking.')
      setBooking(payload.data as RetreatBooking)
      setConfirmCancel(false)
      setRescheduleTo('')
    } catch (error) {
      setBooking(null)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'We could not find that booking.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/retreats')
      .then((res) => res.json())
      .then((payload) => setRetreats(payload.data ?? []))
      .catch(() => setRetreats([]))
  }, [])

  useEffect(() => {
    const param = searchParams.get('code')
    if (!param || autoLookup.current === param) return
    autoLookup.current = param
    setCode(param)
    lookup(param)
  }, [searchParams, lookup])

  const retreat = useMemo(() => retreats.find((item) => item.id === booking?.retreatId), [retreats, booking])

  const rescheduleOptions = useMemo(() => {
    if (!booking) return []
    return getUpcomingRetreats(retreats)
      .map(({ retreat: item }) => item)
      .filter((item) => item.id !== booking.retreatId && item.status === 'Registration Open')
      .slice(0, 6)
  }, [booking, retreats])

  const patchBooking = async (body: Record<string, unknown>, kind: 'cancel' | 'reschedule') => {
    if (!booking) return
    setAction(kind)
    setMessage(null)
    try {
      const response = await fetch(`/api/retreats/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error ?? 'Something went wrong. Please try again.')
      setBooking(payload.data as RetreatBooking)
      setConfirmCancel(false)
      setRescheduleTo('')
      setMessage({
        type: 'success',
        text: kind === 'cancel' ? 'Your booking has been cancelled.' : 'Your booking has been moved. A new confirmation is on its way.',
      })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Something went wrong. Please try again.' })
    } finally {
      setAction(null)
    }
  }

  const status = booking ? statusConfig[booking.status] ?? statusConfig.pending : null
  const cancelled = booking?.status === 'cancelled'
  const ticketUrl =
    booking?.ticketCode && typeof window !== 'undefined'
      ? `${window.location.origin}/retreats/check-booking?code=${encodeURIComponent(booking.ticketCode)}`
      : undefined

  return (
    <main>
      <section className='bg-navy-950 !py-0'>
        <div className='container py-16 text-center sm:py-20'>
          <p className='eyebrow justify-center text-gold-300'>Manage booking</p>
          <h1 className='mt-4 text-5xl text-white sm:text-6xl'>Find your retreat booking</h1>
          <p className='mx-auto mt-4 max-w-xl text-lg text-navy-100'>
            Enter the ticket code from your confirmation email to view your ticket, move to another date or cancel.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              lookup(code)
            }}
            className='mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row'
          >
            <label className='relative flex-1'>
              <span className='sr-only'>Ticket code</span>
              <Ticket className='pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400' />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder='e.g. DMRC-7KQ2X9PA'
                autoCapitalize='characters'
                className='h-14 w-full rounded-full border-0 bg-white pl-12 pr-5 font-mono text-navy-900 placeholder:font-sans placeholder:text-navy-300 focus:outline-none focus:ring-4 focus:ring-gold-300/50'
              />
            </label>
            <Button type='submit' variant='gold' size='xl' className='h-14' disabled={loading}>
              {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Search className='mr-2 h-4 w-4' />}
              Find booking
            </Button>
          </form>
        </div>
      </section>

      <section className='py-12 sm:py-16'>
        <div className='container max-w-5xl'>
          {message && (
            <div
              role={message.type === 'error' ? 'alert' : 'status'}
              className={cn(
                'mb-8 flex items-start gap-3 rounded-2xl px-5 py-4 text-sm',
                message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800',
              )}
            >
              {message.type === 'error' ? <AlertCircle className='h-5 w-5 shrink-0' /> : <CheckCircle2 className='h-5 w-5 shrink-0' />}
              {message.text}
            </div>
          )}

          {!booking ? (
            <div className='grid gap-6 sm:grid-cols-3'>
              {[
                { title: 'Where is my code?', text: 'It starts with DMRC- and is in the confirmation email we sent after you registered.' },
                { title: 'Lost your email?', text: 'Call the retreat office on +255 765 572 679 and we will resend your ticket.' },
                { title: 'Not booked yet?', text: 'Browse upcoming retreats and reserve your place in a few minutes.', href: '/retreats' },
              ].map((item) => (
                <div key={item.title} className='rounded-3xl border border-border bg-white p-6'>
                  <h2 className='font-display text-2xl font-semibold text-navy-900'>{item.title}</h2>
                  <p className='mt-2 text-muted-foreground'>{item.text}</p>
                  {item.href && (
                    <Link href={item.href} className='mt-4 inline-block text-sm font-medium text-gold-700 hover:underline'>
                      See retreats →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='grid gap-8 lg:grid-cols-5'>
              <div className='space-y-6 lg:col-span-3'>
                <div className='rounded-[2rem] border border-border bg-white p-6 shadow-soft sm:p-8'>
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div>
                      <p className='text-sm text-muted-foreground'>Booking for</p>
                      <h2 className='font-display text-3xl font-semibold text-navy-900'>{booking.fullName}</h2>
                    </div>
                    {status && (
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset', status.className)}>
                        <status.icon className='h-4 w-4' /> {status.label}
                      </span>
                    )}
                  </div>
                  <dl className='mt-6 grid gap-4 sm:grid-cols-2'>
                    <div className='rounded-2xl bg-parchment p-4'>
                      <dt className='text-xs uppercase tracking-wider text-muted-foreground'>Retreat</dt>
                      <dd className='mt-1 font-medium text-navy-900'>{booking.retreatTitle}</dd>
                    </div>
                    <div className='rounded-2xl bg-parchment p-4'>
                      <dt className='text-xs uppercase tracking-wider text-muted-foreground'>Payment</dt>
                      <dd className='mt-1 font-medium text-navy-900'>{paymentLabels[booking.paymentStatus] ?? booking.paymentStatus}</dd>
                    </div>
                    {retreat && (
                      <>
                        <div className='flex gap-3 rounded-2xl bg-parchment p-4'>
                          <CalendarDays className='mt-0.5 h-5 w-5 text-gold-500' />
                          <div>
                            <dt className='text-xs uppercase tracking-wider text-muted-foreground'>Dates</dt>
                            <dd className='mt-1 text-navy-900'>{retreat.dateRange}</dd>
                          </div>
                        </div>
                        <div className='flex gap-3 rounded-2xl bg-parchment p-4'>
                          <MapPin className='mt-0.5 h-5 w-5 text-gold-500' />
                          <div>
                            <dt className='text-xs uppercase tracking-wider text-muted-foreground'>Location</dt>
                            <dd className='mt-1 text-navy-900'>{retreat.location}</dd>
                          </div>
                        </div>
                      </>
                    )}
                  </dl>
                </div>

                {!cancelled && booking.paymentStatus === 'pending' && retreat && (
                  <div className='flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-gold-200 bg-gold-50 p-6 sm:flex-row sm:items-center'>
                    <div>
                      <p className='font-semibold text-navy-900'>Your contribution is still pending</p>
                      <p className='text-sm text-navy-700'>Pay online now to complete your registration.</p>
                    </div>
                    <Button asChild variant='gold' size='pill'>
                      <Link href={`/retreats/${retreat.slug}/payment?booking=${booking.id}`}>Pay contribution</Link>
                    </Button>
                  </div>
                )}

                {!cancelled && (
                  <div className='rounded-[2rem] border border-border bg-white p-6 sm:p-8'>
                    <h3 className='font-display text-2xl font-semibold text-navy-900'>Change of plans?</h3>
                    {rescheduleOptions.length > 0 && (
                      <div className='mt-5'>
                        <p className='text-sm font-medium text-navy-800'>Move to another date</p>
                        <div className='mt-3 grid gap-2'>
                          {rescheduleOptions.map((option) => (
                            <label
                              key={option.id}
                              className={cn(
                                'flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition',
                                rescheduleTo === option.id ? 'border-navy-900 bg-navy-50' : 'border-border hover:border-navy-200',
                              )}
                            >
                              <span>
                                <span className='block font-medium text-navy-900'>{option.title}</span>
                                <span className='block text-sm text-muted-foreground'>{option.dateRange}</span>
                              </span>
                              <input
                                type='radio'
                                name='reschedule'
                                className='h-4 w-4 accent-navy-900'
                                checked={rescheduleTo === option.id}
                                onChange={() => setRescheduleTo(option.id)}
                              />
                            </label>
                          ))}
                        </div>
                        <Button
                          className='mt-4'
                          size='pill'
                          disabled={!rescheduleTo || action !== null}
                          onClick={() => patchBooking({ retreatId: rescheduleTo, status: 'rescheduled' }, 'reschedule')}
                        >
                          {action === 'reschedule' && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                          Move my booking
                        </Button>
                      </div>
                    )}
                    <div className='mt-6 border-t border-border pt-6'>
                      {confirmCancel ? (
                        <div className='rounded-2xl bg-red-50 p-4'>
                          <p className='text-sm text-red-800'>Cancel this booking? Refunds follow our cancellation policy.</p>
                          <div className='mt-3 flex gap-2'>
                            <Button
                              variant='destructive'
                              size='pill'
                              disabled={action !== null}
                              onClick={() => patchBooking({ status: 'cancelled' }, 'cancel')}
                            >
                              {action === 'cancel' && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                              Yes, cancel booking
                            </Button>
                            <Button variant='ghost' size='pill' onClick={() => setConfirmCancel(false)}>
                              Keep it
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button type='button' onClick={() => setConfirmCancel(true)} className='text-sm font-medium text-red-700 hover:underline'>
                          Cancel my booking
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className='lg:col-span-2'>
                {booking.ticketCode && !cancelled ? (
                  <RetreatTicket
                    booking={{
                      id: booking.id,
                      fullName: booking.fullName,
                      email: booking.email,
                      phone: booking.phone,
                      ticketCode: booking.ticketCode,
                      status: booking.status,
                    }}
                    retreat={{
                      title: booking.retreatTitle,
                      dateRange: retreat?.dateRange ?? '',
                      timeRange: retreat?.timeRange,
                      location: retreat?.location ?? 'Divine Mercy Retreat Center, Vikindu',
                    }}
                    ticketUrl={ticketUrl}
                  />
                ) : (
                  <div className='rounded-[2rem] border border-dashed border-border p-8 text-center text-muted-foreground'>
                    {cancelled ? 'This booking was cancelled, so its ticket is no longer valid.' : 'No ticket is attached to this booking yet.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default function CheckBookingPage() {
  return (
    <Suspense>
      <CheckBookingContent />
    </Suspense>
  )
}
