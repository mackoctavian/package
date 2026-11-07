'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@/i18n/link'
import { useLocale, useT } from '@/i18n/client'
import { localizeHref } from '@/i18n/navigation'
import { localizeDateRange } from '@/lib/retreats/dates'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CalendarDays, CheckCircle2, Clock, Loader2, MapPin, RefreshCw, Search, Ticket, XCircle } from 'lucide-react'

import RetreatTicket from '@/app/components/Retreats/RetreatTicket'
import { Button } from '@/app/components/ui/button'
import type { RetreatBooking } from '@/app/types/retreat-booking'
import type { RetreatType } from '@/app/types/retreat'
import { getUpcomingRetreats } from '@/lib/retreats/dates'
import { cn } from '@/lib/utils'

type Message = { type: 'success' | 'error'; text: string } | null

const statusConfig: Record<string, { className: string; icon: typeof Clock }> = {
  pending: { className: 'bg-amber-50 text-amber-800 ring-amber-600/20', icon: Clock },
  approved: { className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: CheckCircle2 },
  confirmed: { className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: CheckCircle2 },
  cancelled: { className: 'bg-red-50 text-red-700 ring-red-600/20', icon: XCircle },
  rescheduled: { className: 'bg-sky-50 text-sky-700 ring-sky-600/20', icon: RefreshCw },
}

function CheckBookingContent() {
  const t = useT()
  const locale = useLocale()
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
      setMessage({ type: 'error', text: t('retreats.manage.enterCode') })
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
      if (!response.ok) throw new Error(payload?.error ?? t('retreats.manage.notFound'))
      setBooking(payload.data as RetreatBooking)
      setConfirmCancel(false)
      setRescheduleTo('')
    } catch (error) {
      setBooking(null)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('retreats.manage.notFound') })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetch(`/api/retreats?locale=${locale}`)
      .then((res) => res.json())
      .then((payload) => setRetreats(payload.data ?? []))
      .catch(() => setRetreats([]))
  }, [locale])

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
      if (!response.ok) throw new Error(payload?.error ?? t('common.errors.generic'))
      setBooking(payload.data as RetreatBooking)
      setConfirmCancel(false)
      setRescheduleTo('')
      setMessage({
        type: 'success',
        text: kind === 'cancel' ? t('retreats.manage.cancelled') : t('retreats.manage.moved'),
      })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('common.errors.generic') })
    } finally {
      setAction(null)
    }
  }

  const statusKey = booking && statusConfig[booking.status] ? booking.status : 'pending'
  const status = booking ? statusConfig[statusKey] : null
  const cancelled = booking?.status === 'cancelled'
  const ticketUrl =
    booking?.ticketCode && typeof window !== 'undefined'
      ? `${window.location.origin}${localizeHref(`/retreats/check-booking?code=${encodeURIComponent(booking.ticketCode)}`, locale)}`
      : undefined

  return (
    <main>
      <section className='bg-navy-950 !py-0'>
        <div className='container py-16 text-center sm:py-20'>
          <p className='eyebrow justify-center text-gold-300'>{t('retreats.manage.eyebrow')}</p>
          <h1 className='mt-4 text-5xl text-white sm:text-6xl'>{t('retreats.manage.title')}</h1>
          <p className='mx-auto mt-4 max-w-xl text-lg text-navy-100'>{t('retreats.manage.text')}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              lookup(code)
            }}
            className='mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row'
          >
            <label className='relative flex-1'>
              <span className='sr-only'>{t('retreats.manage.codeLabel')}</span>
              <Ticket className='pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400' />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('retreats.manage.codePlaceholder')}
                autoCapitalize='characters'
                className='h-14 w-full rounded-full border-0 bg-white pl-12 pr-5 font-mono text-navy-900 placeholder:font-sans placeholder:text-navy-300 focus:outline-none focus:ring-4 focus:ring-gold-300/50'
              />
            </label>
            <Button type='submit' variant='gold' size='xl' className='h-14' disabled={loading}>
              {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Search className='mr-2 h-4 w-4' />}
              {t('retreats.manage.find')}
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
                { title: t('retreats.manage.help.where.title'), text: t('retreats.manage.help.where.text') },
                { title: t('retreats.manage.help.lost.title'), text: t('retreats.manage.help.lost.text') },
                { title: t('retreats.manage.help.notBooked.title'), text: t('retreats.manage.help.notBooked.text'), href: '/retreats' },
              ].map((item) => (
                <div key={item.title} className='rounded-3xl border border-border bg-white p-6'>
                  <h2 className='font-display text-2xl font-semibold text-navy-900'>{item.title}</h2>
                  <p className='mt-2 text-muted-foreground'>{item.text}</p>
                  {item.href && (
                    <Link href={item.href} className='mt-4 inline-block text-sm font-medium text-gold-700 hover:underline'>
                      {t('retreats.manage.help.seeRetreats')}
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
                      <p className='text-sm text-muted-foreground'>{t('retreats.manage.bookingFor')}</p>
                      <h2 className='font-display text-3xl font-semibold text-navy-900'>{booking.fullName}</h2>
                    </div>
                    {status && (
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset', status.className)}>
                        <status.icon className='h-4 w-4' /> {t.dynamic(`retreats.manage.statuses.${statusKey}`)}
                      </span>
                    )}
                  </div>
                  <dl className='mt-6 grid gap-4 sm:grid-cols-2'>
                    <div className='rounded-2xl bg-parchment p-4'>
                      <dt className='text-xs uppercase tracking-wider text-muted-foreground'>{t('retreats.manage.retreat')}</dt>
                      <dd className='mt-1 font-medium text-navy-900'>{retreat?.title ?? booking.retreatTitle}</dd>
                    </div>
                    <div className='rounded-2xl bg-parchment p-4'>
                      <dt className='text-xs uppercase tracking-wider text-muted-foreground'>{t('retreats.manage.payment')}</dt>
                      <dd className='mt-1 font-medium text-navy-900'>
                        {t.dynamic(`retreats.manage.payments.${booking.paymentStatus}`, undefined, booking.paymentStatus)}
                      </dd>
                    </div>
                    {retreat && (
                      <>
                        <div className='flex gap-3 rounded-2xl bg-parchment p-4'>
                          <CalendarDays className='mt-0.5 h-5 w-5 text-gold-500' />
                          <div>
                            <dt className='text-xs uppercase tracking-wider text-muted-foreground'>{t('retreats.manage.dates')}</dt>
                            <dd className='mt-1 text-navy-900'>{localizeDateRange(retreat.dateRange, locale)}</dd>
                          </div>
                        </div>
                        <div className='flex gap-3 rounded-2xl bg-parchment p-4'>
                          <MapPin className='mt-0.5 h-5 w-5 text-gold-500' />
                          <div>
                            <dt className='text-xs uppercase tracking-wider text-muted-foreground'>{t('retreats.manage.location')}</dt>
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
                      <p className='font-semibold text-navy-900'>{t('retreats.manage.pendingTitle')}</p>
                      <p className='text-sm text-navy-700'>{t('retreats.manage.pendingText')}</p>
                    </div>
                    <Button asChild variant='gold' size='pill'>
                      <Link href={`/retreats/${retreat.slug}/payment?booking=${booking.id}`}>{t('retreats.manage.pay')}</Link>
                    </Button>
                  </div>
                )}

                {!cancelled && (
                  <div className='rounded-[2rem] border border-border bg-white p-6 sm:p-8'>
                    <h3 className='font-display text-2xl font-semibold text-navy-900'>{t('retreats.manage.changeTitle')}</h3>
                    {rescheduleOptions.length > 0 && (
                      <div className='mt-5'>
                        <p className='text-sm font-medium text-navy-800'>{t('retreats.manage.moveTo')}</p>
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
                                <span className='block text-sm text-muted-foreground'>{localizeDateRange(option.dateRange, locale)}</span>
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
                          {t('retreats.manage.move')}
                        </Button>
                      </div>
                    )}
                    <div className='mt-6 border-t border-border pt-6'>
                      {confirmCancel ? (
                        <div className='rounded-2xl bg-red-50 p-4'>
                          <p className='text-sm text-red-800'>{t('retreats.manage.cancelPrompt')}</p>
                          <div className='mt-3 flex gap-2'>
                            <Button
                              variant='destructive'
                              size='pill'
                              disabled={action !== null}
                              onClick={() => patchBooking({ status: 'cancelled' }, 'cancel')}
                            >
                              {action === 'cancel' && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                              {t('retreats.manage.cancelYes')}
                            </Button>
                            <Button variant='ghost' size='pill' onClick={() => setConfirmCancel(false)}>
                              {t('retreats.manage.keep')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button type='button' onClick={() => setConfirmCancel(true)} className='text-sm font-medium text-red-700 hover:underline'>
                          {t('retreats.manage.cancel')}
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
                      title: retreat?.title ?? booking.retreatTitle,
                      dateRange: localizeDateRange(retreat?.dateRange, locale),
                      timeRange: retreat?.timeRange,
                      location: retreat?.location ?? t('retreats.manage.defaultLocation'),
                    }}
                    ticketUrl={ticketUrl}
                  />
                ) : (
                  <div className='rounded-[2rem] border border-dashed border-border p-8 text-center text-muted-foreground'>
                    {cancelled ? t('retreats.manage.ticketCancelled') : t('retreats.manage.noTicket')}
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
