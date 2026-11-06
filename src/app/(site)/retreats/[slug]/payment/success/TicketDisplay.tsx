'use client'

import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, MapPin, User, Mail, Phone, Download, Ticket, CheckCircle2, Loader2 } from 'lucide-react'

const palette = {
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0f172a',
  blue500: '#b98a36',
  blue600: '#172a4a',
  indigo600: '#0f1e38',
  emerald50: '#ecfdf5',
  emerald400: '#34d399',
  emerald600: '#059669',
}

interface TicketDisplayProps {
  booking: {
    id: string
    fullName: string
    email: string
    phone: string
    ticketCode: string
    status: string
  }
  retreat: {
    title: string
    dateRange: string
    timeRange?: string
    location: string
  }
  ticketUrl?: string
}

export default function TicketDisplay({ booking, retreat, ticketUrl }: TicketDisplayProps) {
  const ticketRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!ticketRef.current || isDownloading) return

    setIsDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      })

      const link = document.createElement('a')
      link.download = `retreat-ticket-${booking.ticketCode}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download ticket:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Ticket */}
      <div
        ref={ticketRef}
        className='rounded-3xl overflow-hidden shadow-2xl border max-w-md mx-auto'
        style={{ backgroundColor: '#ffffff', borderColor: palette.slate200, color: palette.slate600 }}>
        {/* Header */}
        <div
          className='p-6 text-white relative overflow-hidden'
          style={{ background: `linear-gradient(130deg, ${palette.blue600}, ${palette.indigo600})` }}>
          <div className='absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none' style={{ background: 'rgba(255,255,255,0.12)' }} />
          <div className='absolute bottom-0 left-0 w-24 h-24 rounded-full pointer-events-none' style={{ background: 'rgba(255,255,255,0.12)' }} />
          <div className='relative'>
            <div className='flex items-center gap-2 mb-3'>
              <Ticket className='h-5 w-5' />
              <span className='text-sm font-medium opacity-90'>Retreat Ticket</span>
            </div>
            <h2 className='text-2xl font-bold leading-tight'>{retreat.title}</h2>
          </div>
        </div>

        {/* QR Code Section */}
        <div className='p-8 flex flex-col items-center' style={{ background: `linear-gradient(180deg, ${palette.slate50}, #ffffff)` }}>
          <div className='bg-white p-5 rounded-2xl shadow-lg' style={{ border: `1px solid ${palette.slate200}` }}>
            <QRCodeSVG value={ticketUrl ?? booking.ticketCode} size={160} level='H' includeMargin={false} />
          </div>
          <p className='mt-5 text-3xl font-mono font-bold tracking-widest' style={{ color: palette.slate900 }}>
            {booking.ticketCode}
          </p>
          <p className='text-sm mt-2' style={{ color: palette.slate500 }}>
            Scan at check-in for fast entry
          </p>
        </div>

        {/* Details */}
        <div className='p-6 space-y-5'>
          {/* Attendee Info */}
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full flex items-center justify-center' style={{ backgroundColor: '#dbeafe' }}>
                <User className='h-4 w-4' style={{ color: palette.blue600 }} />
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide' style={{ color: palette.slate500 }}>
                  Attendee
                </p>
                <p className='font-semibold' style={{ color: palette.slate900 }}>
                  {booking.fullName}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full flex items-center justify-center' style={{ backgroundColor: palette.slate50 }}>
                <Mail className='h-4 w-4' style={{ color: palette.slate600 }} />
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide' style={{ color: palette.slate500 }}>
                  Email
                </p>
                <p className='text-sm' style={{ color: palette.slate700 }}>
                  {booking.email}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full flex items-center justify-center' style={{ backgroundColor: palette.slate50 }}>
                <Phone className='h-4 w-4' style={{ color: palette.slate600 }} />
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide' style={{ color: palette.slate500 }}>
                  Phone
                </p>
                <p className='text-sm' style={{ color: palette.slate700 }}>
                  {booking.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Divider with cutout effect */}
          <div className='border-t-2 border-dashed relative py-1' style={{ borderColor: palette.slate200 }}>
            <div className='absolute -left-9 -top-4 w-8 h-8 rounded-full' style={{ background: `linear-gradient(180deg, ${palette.slate50}, #ffffff)` }} />
            <div className='absolute -right-9 -top-4 w-8 h-8 rounded-full' style={{ background: `linear-gradient(180deg, ${palette.slate50}, #ffffff)` }} />
          </div>

          {/* Retreat Info */}
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full flex items-center justify-center' style={{ backgroundColor: palette.emerald50 }}>
                <CalendarDays className='h-4 w-4' style={{ color: palette.emerald600 }} />
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide' style={{ color: palette.slate500 }}>
                  Date & Time
                </p>
                <p className='font-semibold' style={{ color: palette.slate900 }}>
                  {retreat.dateRange}
                </p>
                {retreat.timeRange && (
                  <p className='text-xs' style={{ color: palette.slate500 }}>
                    {retreat.timeRange}
                  </p>
                )}
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full flex items-center justify-center' style={{ backgroundColor: palette.emerald50 }}>
                <MapPin className='h-4 w-4' style={{ color: palette.emerald600 }} />
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide' style={{ color: palette.slate500 }}>
                  Location
                </p>
                <p className='font-semibold' style={{ color: palette.slate900 }}>
                  {retreat.location}
                </p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className='flex items-center justify-center gap-2 py-4 rounded-xl border'
            style={{ backgroundColor: palette.emerald50, borderColor: '#a7f3d0', color: palette.emerald600 }}>
            <CheckCircle2 className='h-5 w-5' />
            <span className='font-bold'>Booking Confirmed</span>
          </div>
        </div>

        {/* Footer */}
        <div
          className='px-6 py-4 text-center border-t'
          style={{ backgroundColor: palette.slate50, borderColor: palette.slate100, color: palette.slate600 }}>
          <p className='text-sm font-semibold'>Divine Mercy Retreat Center</p>
          <p className='text-xs mt-1'>Present this ticket at check-in</p>
        </div>
      </div>

      {/* Download Button */}
      <div className='flex justify-center'>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className='inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'
          style={{
            backgroundColor: palette.slate900,
            color: '#ffffff',
            boxShadow: '0 20px 25px -5px rgba(15,23,42,0.3)',
          }}>
          {isDownloading ? (
            <Loader2 className='h-5 w-5 animate-spin' />
          ) : (
            <Download className='h-5 w-5' />
          )}
          Download Ticket
        </button>
      </div>
    </div>
  )
}








