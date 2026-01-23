'use client'

import { useMemo, type ComponentType } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { ArrowLeft, CalendarDays, CreditCard, Loader2, Mail, MapPin, Phone, User, Users, Ticket, MessageSquare } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import RetreatTicket from '@/app/components/Retreats/RetreatTicket'
import type { RetreatBooking } from '@/app/types/retreat-booking'
import type { RetreatType } from '@/app/types/retreat'

type BookingResponse = {
  data?: RetreatBooking
}

type RetreatResponse = {
  data?: RetreatType
}

const fetchBooking = async (bookingId: string): Promise<BookingResponse> => {
  const response = await fetch(`/api/retreats/bookings/${bookingId}`, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error ?? 'Unable to load booking.')
  }
  return response.json()
}

const fetchRetreat = async (retreatId: string): Promise<RetreatResponse> => {
  const response = await fetch(`/api/retreats/${retreatId}`, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error ?? 'Unable to load retreat.')
  }
  return response.json()
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const paymentCopy: Record<RetreatBooking['paymentStatus'], { label: string; badge: 'default' | 'outline' | 'success' | 'warning' }> = {
  pending: { label: 'Pending', badge: 'warning' },
  paid: { label: 'Paid', badge: 'success' },
  refunded: { label: 'Refunded', badge: 'outline' },
  waived: { label: 'Waived', badge: 'outline' },
}

type RetreatBookingDetailProps = {
  retreatId: string
  bookingId: string
}

const RetreatBookingDetail = ({ retreatId, bookingId }: RetreatBookingDetailProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const bookingQuery = useQuery({
    queryKey: ['retreat-booking', bookingId],
    queryFn: () => fetchBooking(bookingId),
  })

  const retreatQuery = useQuery({
    queryKey: ['retreat-meta', retreatId],
    queryFn: () => fetchRetreat(retreatId),
  })

  const booking = bookingQuery.data?.data
  const retreat = retreatQuery.data?.data

  const paymentMutation = useMutation({
    mutationFn: async (nextStatus: RetreatBooking['paymentStatus']) => {
      const response = await fetch(`/api/retreats/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to update payment.')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Booking updated')
      queryClient.invalidateQueries({ queryKey: ['retreat-booking', bookingId] })
      queryClient.invalidateQueries({ queryKey: ['retreat', retreatId] })
      queryClient.invalidateQueries({ queryKey: ['retreat-attendees', retreatId] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    },
  })

  const ticketUrl = useMemo(() => {
    if (!booking?.ticketCode) return undefined
    if (typeof window === 'undefined') return booking.ticketCode
    return `${window.location.origin}/retreats/check-booking?code=${encodeURIComponent(booking.ticketCode)}`
  }, [booking?.ticketCode])

  const formEntries = useMemo(() => {
    if (!booking?.formPayload || typeof booking.formPayload !== 'object') return []
    return Object.entries(booking.formPayload).filter(([, value]) => value !== null && value !== '')
  }, [booking?.formPayload])

  if (bookingQuery.isLoading || retreatQuery.isLoading) {
    return (
      <div className='space-y-6'>
        <Button variant='ghost' size='sm' className='w-fit' onClick={() => router.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' /> Back
        </Button>
        <Card>
          <CardContent className='flex h-48 items-center justify-center text-sm text-slate-500'>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Loading booking…
          </CardContent>
        </Card>
      </div>
    )
  }

  if (bookingQuery.isError || !booking) {
    return (
      <div className='space-y-6'>
        <Button variant='ghost' size='sm' className='w-fit' onClick={() => router.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' /> Back
        </Button>
        <Card>
          <CardContent className='flex h-48 flex-col items-center justify-center gap-3 text-center text-sm text-red-600'>
            <p>{bookingQuery.error instanceof Error ? bookingQuery.error.message : 'Unable to load booking.'}</p>
            <Button variant='outline' size='sm' onClick={() => bookingQuery.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const paymentMeta = paymentCopy[booking.paymentStatus]

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <Button variant='ghost' size='sm' className='w-fit px-0 hover:text-primary' onClick={() => router.push(`/admin/retreats/${retreatId}`)}>
          <ArrowLeft className='mr-2 h-4 w-4' /> Back to retreat
        </Button>
        <div className='flex items-center gap-3'>
          <Badge variant='outline' className='font-mono'>
            Booking ID: {booking.id}
          </Badge>
          {booking.ticketCode ? (
            <Badge variant='outline' className='font-mono'>
              Ticket: {booking.ticketCode}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-[2fr_1fr]'>
        <Card>
          <CardHeader>
            <CardTitle>Guest overview</CardTitle>
            <CardDescription>Contact details, booking status, and metadata.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
              <Badge variant='outline' className='uppercase tracking-[0.2em] text-xs'>
                {booking.status}
              </Badge>
              <Badge variant={paymentMeta.badge}>{paymentMeta.label}</Badge>
              {booking.attended && <Badge variant='success'>Checked-in</Badge>}
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-1'>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Guest</p>
                <p className='text-lg font-semibold text-slate-900'>{booking.fullName}</p>
                <p className='text-xs text-slate-500'>Registered {formatDate(booking.createdAt)}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Retreat</p>
                <p className='text-lg font-semibold text-slate-900'>{booking.retreatTitle}</p>
                {retreat?.dateRange ? <p className='text-xs text-slate-500'>{retreat.dateRange}</p> : null}
              </div>
            </div>
            <div className='grid gap-3 md:grid-cols-3'>
              <InfoTile label='Email' icon={Mail} value={booking.email} href={`mailto:${booking.email}`} />
              <InfoTile label='Phone' icon={Phone} value={booking.phone} href={`tel:${booking.phone}`} />
              <InfoTile label='WhatsApp' icon={MessageSquare} value={booking.whatsapp || '—'} href={booking.whatsapp ? `https://wa.me/${booking.whatsapp}` : undefined} />
            </div>
            <div className='grid gap-3 md:grid-cols-2'>
              <InfoTile label='Booking created' icon={CalendarDays} value={formatDate(booking.createdAt)} />
              <InfoTile label='Last updated' icon={CalendarDays} value={formatDate(booking.updatedAt)} />
            </div>
            {booking.notes ? (
              <div className='rounded-xl border border-slate-200 bg-slate-50/70 p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Admin notes</p>
                <p className='mt-1 text-sm text-slate-700'>{booking.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment & actions</CardTitle>
            <CardDescription>Update payment state or navigate to attendee tools.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
              <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Current payment status</p>
              <div className='mt-2 flex items-center gap-2'>
                <CreditCard className='h-4 w-4 text-slate-600' />
                <span className='text-sm font-semibold text-slate-900'>{paymentMeta.label}</span>
              </div>
            </div>
            <div className='flex flex-wrap gap-3'>
              {booking.paymentStatus !== 'paid' ? (
                <Button className='gap-2' onClick={() => paymentMutation.mutate('paid')} disabled={paymentMutation.isPending}>
                  {paymentMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <CreditCard className='h-4 w-4' />}
                  Mark as paid
                </Button>
              ) : (
                <Button variant='outline' className='gap-2' onClick={() => paymentMutation.mutate('pending')} disabled={paymentMutation.isPending}>
                  {paymentMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <CreditCard className='h-4 w-4' />}
                  Set as pending
                </Button>
              )}
            </div>
            <div className='rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600'>
              <p className='font-semibold text-slate-900'>Need to manage attendance?</p>
              <p className='text-xs text-slate-500'>Open the attendee manager for scanning, approvals, and exports.</p>
              <Link href={`/admin/retreats/${retreatId}/attendees`} className='mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline'>
                <Users className='h-4 w-4' />
                Open attendee manager
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <CardTitle>Ticket & QR</CardTitle>
            <CardDescription>Downloadable pass to resend or print for the guest.</CardDescription>
          </div>
          {booking.ticketCode ? (
            <Badge variant='outline' className='font-mono'>
              {booking.ticketCode}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent>
          {booking.ticketCode && retreat ? (
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
                title: retreat.title,
                dateRange: retreat.dateRange,
                timeRange: retreat.timeRange,
                location: retreat.location,
              }}
              ticketUrl={ticketUrl}
            />
          ) : (
            <div className='rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500'>
              <p className='font-semibold text-slate-700'>No ticket yet</p>
              <p className='mt-1'>Approve this booking to generate a ticket with a QR code and reference number.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {(booking.familyMembers?.length || formEntries.length) && (
        <Card>
          <CardHeader>
            <CardTitle>Registration details</CardTitle>
            <CardDescription>Family members and custom form responses.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {booking.familyMembers?.length ? (
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Family members</p>
                <div className='space-y-2'>
                  {booking.familyMembers.map((member, index) => (
                    <div key={`${member.name}-${index}`} className='rounded-xl border border-slate-200 p-3 text-sm text-slate-700'>
                      <p className='font-semibold text-slate-900'>{member.name}</p>
                      <p className='text-xs text-slate-500'>
                        {member.relationship} · {member.age}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {formEntries.length ? (
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Form responses</p>
                <div className='grid gap-3 md:grid-cols-2'>
                  {formEntries.map(([key, value]) => (
                    <div key={key} className='rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-700'>
                      <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{key}</p>
                      <p className='mt-1 text-sm text-slate-900'>{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {retreat && (
        <Card>
          <CardHeader>
            <CardTitle>Retreat details</CardTitle>
            <CardDescription>What the guest registered for.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-3'>
            <InfoTile label='Retreat' icon={Ticket} value={retreat.title} />
            <InfoTile label='Schedule' icon={CalendarDays} value={retreat.dateRange} helper={retreat.timeRange} />
            <InfoTile label='Location' icon={MapPin} value={retreat.location} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

type InfoTileProps = {
  label: string
  value?: string | null
  helper?: string | null
  icon: ComponentType<{ className?: string }>
  href?: string
}

const InfoTile = ({ label, value, helper, icon: Icon, href }: InfoTileProps) => {
  const content = (
    <div className='rounded-xl border border-slate-200 p-4 hover:border-slate-300'>
      <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
        <Icon className='h-4 w-4 text-slate-400' />
        {label}
      </div>
      <p className='mt-2 text-sm font-semibold text-slate-900'>{value ?? '—'}</p>
      {helper ? <p className='text-xs text-slate-500'>{helper}</p> : null}
    </div>
  )

  if (href && value) {
    return (
      <Link href={href} target={href.startsWith('http') ? '_blank' : undefined} rel='noopener noreferrer'>
        {content}
      </Link>
    )
  }

  return content
}

export default RetreatBookingDetail


