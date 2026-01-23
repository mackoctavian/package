import prisma from '@/lib/prisma'

import React from 'react'
import { RetreatBookingEmail } from '@/lib/email/templates/RetreatBookingEmail'
import { getResendClient, getResendFrom } from './resend'

export type RetreatBookingEmailKind = 'created' | 'rescheduled'

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

const buildText = (args: {
  kind: RetreatBookingEmailKind
  guestName: string
  retreatTitle: string
  dateRange?: string | null
  timeRange?: string | null
  location?: string | null
  ticketCode: string
  ticketUrl: string
}) => {
  const intro =
    args.kind === 'rescheduled'
      ? 'Your retreat booking has been updated.'
      : 'Your retreat booking is confirmed.'
  const schedule = `${args.dateRange || 'TBA'}${args.timeRange ? ` • ${args.timeRange}` : ''}`

  return [
    `Hello ${args.guestName || 'Guest'},`,
    intro,
    '',
    `Retreat: ${args.retreatTitle}`,
    `Schedule: ${schedule}`,
    `Location: ${args.location || 'TBA'}`,
    `Ticket Code: ${args.ticketCode}`,
    `Ticket Link: ${args.ticketUrl}`,
    '',
    'Present your ticket code at check-in. If you did not make this booking, please ignore this email.',
  ].join('\n')
}

export async function sendRetreatBookingEmail(args: { bookingId: string; kind: RetreatBookingEmailKind }) {
  const resend = getResendClient()

  const record = await prisma.retreatBooking.findUnique({
    where: { id: args.bookingId },
    include: { retreat: true },
  })

  if (!record) {
    throw new Error('Booking not found.')
  }
  if (!record.email) {
    throw new Error('Booking is missing email.')
  }
  if (!record.ticketCode) {
    throw new Error('Booking is missing ticket code.')
  }

  const ticketUrl = buildTicketUrl(record.ticketCode)
  const subject =
    args.kind === 'rescheduled'
      ? `Booking updated: ${record.retreatTitle || record.retreat?.title || 'Retreat'}`
      : `Booking confirmed: ${record.retreatTitle || record.retreat?.title || 'Retreat'}`

  const emailProps = {
    kind: args.kind,
    guestName: record.fullName || 'Guest',
    retreatTitle: record.retreatTitle || record.retreat?.title || 'Retreat',
    dateRange: record.retreat?.dateRange,
    timeRange: record.retreat?.timeRange,
    location: record.retreat?.location,
    ticketCode: record.ticketCode,
    ticketUrl,
  }

  await resend.emails.send({
    from: getResendFrom(),
    to: record.email,
    subject,
    react: React.createElement(RetreatBookingEmail, emailProps),
    text: buildText(emailProps),
  })

  return { ok: true, to: record.email }
}

