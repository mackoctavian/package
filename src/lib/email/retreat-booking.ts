import prisma from '@/lib/prisma'

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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const buildHtml = (args: {
  kind: RetreatBookingEmailKind
  guestName: string
  retreatTitle: string
  dateRange?: string | null
  timeRange?: string | null
  location?: string | null
  ticketCode: string
  ticketUrl: string
}) => {
  const title =
    args.kind === 'rescheduled' ? 'Your retreat booking has been updated' : 'Your retreat booking is confirmed'
  const preheader =
    args.kind === 'rescheduled'
      ? `Updated booking for ${args.retreatTitle}. Ticket: ${args.ticketCode}`
      : `Confirmed booking for ${args.retreatTitle}. Ticket: ${args.ticketCode}`

  const retreatTitle = escapeHtml(args.retreatTitle)
  const guestName = escapeHtml(args.guestName)

  const dateLine = args.dateRange ? escapeHtml(args.dateRange) : 'TBA'
  const timeLine = args.timeRange ? escapeHtml(args.timeRange) : ''
  const locationLine = args.location ? escapeHtml(args.location) : 'TBA'
  const ticketCode = escapeHtml(args.ticketCode)
  const ticketUrl = args.ticketUrl

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#0b1220;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td align="center" style="padding:32px 12px">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:18px 20px;color:#e2e8f0">
                <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#93c5fd;font-weight:700">DMRC</div>
                <div style="font-size:24px;font-weight:800;margin-top:6px;color:#ffffff">${title}</div>
                <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#cbd5e1">
                  Hello <strong style="color:#ffffff">${guestName}</strong>, your booking details are below.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 20px 18px">
                <div style="border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.06);border-radius:18px;padding:18px">
                  <div style="font-size:16px;font-weight:800;color:#ffffff">${retreatTitle}</div>
                  <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap">
                    <div style="flex:1;min-width:220px">
                      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;font-weight:800">Schedule</div>
                      <div style="margin-top:6px;font-size:14px;color:#e2e8f0;line-height:1.5">${dateLine}${timeLine ? ` • ${timeLine}` : ''}</div>
                    </div>
                    <div style="flex:1;min-width:220px">
                      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;font-weight:800">Location</div>
                      <div style="margin-top:6px;font-size:14px;color:#e2e8f0;line-height:1.5">${locationLine}</div>
                    </div>
                  </div>
                  <div style="margin-top:14px;border-top:1px solid rgba(255,255,255,0.08);padding-top:14px">
                    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;font-weight:800">Your Ticket Code</div>
                    <div style="margin-top:6px;font-size:18px;font-weight:900;letter-spacing:0.08em;color:#ffffff;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace">${ticketCode}</div>
                    <div style="margin-top:10px">
                      <a href="${ticketUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px">
                        View / Download Ticket
                      </a>
                    </div>
                    <div style="margin-top:10px;font-size:12px;line-height:1.6;color:#cbd5e1">
                      Present your ticket code at check-in. If you need to manage your booking, use the link above.
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 20px 24px;color:#94a3b8;font-size:12px;line-height:1.6">
                If you did not make this booking, please ignore this email.
                <br />
                <span style="color:#64748b">Divine Mercy Retreat Center</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
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

  const html = buildHtml({
    kind: args.kind,
    guestName: record.fullName || 'Guest',
    retreatTitle: record.retreatTitle || record.retreat?.title || 'Retreat',
    dateRange: record.retreat?.dateRange,
    timeRange: record.retreat?.timeRange,
    location: record.retreat?.location,
    ticketCode: record.ticketCode,
    ticketUrl,
  })

  await resend.emails.send({
    from: getResendFrom(),
    to: record.email,
    subject,
    html,
  })

  return { ok: true, to: record.email }
}

