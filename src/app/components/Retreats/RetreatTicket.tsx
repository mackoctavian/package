'use client'

import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, MapPin, User, Mail, Phone, Download, Ticket, CheckCircle2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useBranding } from '@/app/hooks/useBranding'
import { useT } from '@/i18n/client'

const palette = {
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate900: '#0f172a',
  blue500: '#b98a36',
  blue600: '#172a4a',
  indigo600: '#20365b',
  purple600: '#0f1e38',
  emerald50: '#ecfdf5',
  emerald600: '#059669',
}

interface RetreatTicketProps {
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

export default function RetreatTicket({ booking, retreat, ticketUrl }: RetreatTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null)
  const { logoUrl } = useBranding()
  const t = useT()

  const handleDownload = async () => {
    if (!ticketRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      
      const link = document.createElement('a')
      link.download = `retreat-ticket-${booking.ticketCode}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download ticket:', error)
    }
  }

  return (
    <div className='space-y-4'>
      {/* Ticket */}
      <div
        ref={ticketRef}
        className='rounded-2xl overflow-hidden shadow-xl border max-w-md mx-auto'
        style={{ backgroundColor: '#fff', borderColor: palette.slate200, color: palette.slate600 }}>
        {/* Header */}
        <div
          className='p-6 text-white relative overflow-hidden'
          style={{ background: `linear-gradient(135deg, ${palette.blue600}, ${palette.indigo600}, ${palette.purple600})` }}>
          <div
            className='absolute inset-0 pointer-events-none'
            style={{ background: 'radial-gradient(circle at top right, rgba(255,255,255,0.5), transparent 55%)', opacity: 0.4 }}
          />
          <div className='relative flex items-center gap-2 mb-2'>
            <Ticket className='h-5 w-5' />
            <span className='text-sm font-medium opacity-90'>{t('retreats.ticket.label')}</span>
          </div>
          <div className='relative'>
            <h2 className='text-2xl font-bold'>{retreat.title}</h2>
          </div>
        </div>

        {/* QR Code Section */}
        <div className='p-6 flex flex-col items-center' style={{ backgroundColor: palette.slate50 }}>
          <div className='bg-white p-4 rounded-xl shadow-sm' style={{ border: `1px solid ${palette.slate200}` }}>
            <QRCodeSVG
              value={ticketUrl ?? booking.ticketCode}
              size={180}
              level='H'
              includeMargin
              imageSettings={{
                src: logoUrl,
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          </div>
          <p className='mt-4 text-2xl font-mono font-bold tracking-wider' style={{ color: palette.slate900 }}>
            {booking.ticketCode}
          </p>
          <p className='text-sm mt-1' style={{ color: palette.slate500 }}>
            {t('retreats.ticket.scan')}
          </p>
        </div>

        {/* Details */}
        <div className='p-6 space-y-4'>
          {/* Attendee Info */}
          <div className='space-y-2'>
            <div className='flex items-center gap-3' style={{ color: palette.slate600 }}>
              <User className='h-4 w-4' style={{ color: palette.slate400 }} />
              <span className='font-medium' style={{ color: palette.slate900 }}>
                {booking.fullName}
              </span>
            </div>
            <div className='flex items-center gap-3' style={{ color: palette.slate600 }}>
              <Mail className='h-4 w-4' style={{ color: palette.slate400 }} />
              <span className='text-sm'>{booking.email}</span>
            </div>
            <div className='flex items-center gap-3' style={{ color: palette.slate600 }}>
              <Phone className='h-4 w-4' style={{ color: palette.slate400 }} />
              <span className='text-sm'>{booking.phone}</span>
            </div>
          </div>

          {/* Divider */}
          <div className='border-t border-dashed relative' style={{ borderColor: palette.slate200 }}>
            <div className='absolute -left-6 -top-3 w-6 h-6 rounded-full' style={{ backgroundColor: palette.slate100 }} />
            <div className='absolute -right-6 -top-3 w-6 h-6 rounded-full' style={{ backgroundColor: palette.slate100 }} />
          </div>

          {/* Retreat Info */}
          <div className='space-y-2'>
            <div className='flex items-center gap-3' style={{ color: palette.slate600 }}>
              <CalendarDays className='h-4 w-4' style={{ color: palette.blue500 }} />
              <div>
                <span className='font-medium' style={{ color: palette.slate900 }}>
                  {retreat.dateRange}
                </span>
                {retreat.timeRange && (
                  <p className='text-xs' style={{ color: palette.slate500 }}>
                    {retreat.timeRange}
                  </p>
                )}
              </div>
            </div>
            <div className='flex items-center gap-3' style={{ color: palette.slate600 }}>
              <MapPin className='h-4 w-4' style={{ color: palette.blue500 }} />
              <span>{retreat.location}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className='flex items-center justify-center gap-2 py-3 rounded-xl'
            style={{ backgroundColor: palette.emerald50, color: palette.emerald600 }}>
            <CheckCircle2 className='h-5 w-5' />
            <span className='font-semibold'>{['approved', 'confirmed', 'checked-in'].includes(booking.status) ? t('retreats.ticket.confirmed') : t('retreats.ticket.received')}</span>
          </div>
        </div>

        {/* Footer */}
        <div
          className='px-6 py-4 text-center border-t'
          style={{ backgroundColor: palette.slate50, borderColor: palette.slate100, color: palette.slate500 }}>
          <p className='text-xs font-semibold'>Divine Mercy Retreat Center</p>
          <p className='text-xs mt-1'>{t('retreats.ticket.present')}</p>
        </div>
      </div>

      {/* Download Button */}
      <div className='flex justify-center'>
        <Button onClick={handleDownload} className='gap-2' style={{ backgroundColor: palette.slate900, color: '#ffffff' }}>
          <Download className='h-4 w-4' />
          {t('retreats.ticket.download')}
        </Button>
      </div>
    </div>
  )
}








