'use client'

import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, MapPin, User, Mail, Phone, Download, Ticket, CheckCircle2, Loader2 } from 'lucide-react'

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
}

export default function TicketDisplay({ booking, retreat }: TicketDisplayProps) {
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
      link.click()
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
        className='bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-w-md mx-auto'
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2' />
          <div className='absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2' />
          <div className='relative'>
            <div className='flex items-center gap-2 mb-3'>
              <Ticket className='h-5 w-5' />
              <span className='text-sm font-medium opacity-90'>Retreat Ticket</span>
            </div>
            <h2 className='text-2xl font-bold leading-tight'>{retreat.title}</h2>
          </div>
        </div>

        {/* QR Code Section */}
        <div className='p-8 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center'>
          <div className='bg-white p-5 rounded-2xl shadow-lg border border-slate-100'>
            <QRCodeSVG
              value={booking.ticketCode}
              size={160}
              level='H'
              includeMargin={false}
            />
          </div>
          <p className='mt-5 text-3xl font-mono font-bold text-slate-900 tracking-widest'>
            {booking.ticketCode}
          </p>
          <p className='text-sm text-slate-500 mt-2'>Scan at check-in for fast entry</p>
        </div>

        {/* Details */}
        <div className='p-6 space-y-5'>
          {/* Attendee Info */}
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center'>
                <User className='h-4 w-4 text-blue-600' />
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide'>Attendee</p>
                <p className='font-semibold text-slate-900'>{booking.fullName}</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center'>
                <Mail className='h-4 w-4 text-slate-600' />
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide'>Email</p>
                <p className='text-sm text-slate-700'>{booking.email}</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center'>
                <Phone className='h-4 w-4 text-slate-600' />
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide'>Phone</p>
                <p className='text-sm text-slate-700'>{booking.phone}</p>
              </div>
            </div>
          </div>

          {/* Divider with cutout effect */}
          <div className='border-t-2 border-dashed border-slate-200 relative py-1'>
            <div className='absolute -left-9 -top-4 w-8 h-8 bg-gradient-to-b from-slate-50 to-white rounded-full' />
            <div className='absolute -right-9 -top-4 w-8 h-8 bg-gradient-to-b from-slate-50 to-white rounded-full' />
          </div>

          {/* Retreat Info */}
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center'>
                <CalendarDays className='h-4 w-4 text-emerald-600' />
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide'>Date & Time</p>
                <p className='font-semibold text-slate-900'>{retreat.dateRange}</p>
                {retreat.timeRange && <p className='text-xs text-slate-500'>{retreat.timeRange}</p>}
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center'>
                <MapPin className='h-4 w-4 text-emerald-600' />
              </div>
              <div>
                <p className='text-xs text-slate-500 uppercase tracking-wide'>Location</p>
                <p className='font-semibold text-slate-900'>{retreat.location}</p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className='flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100'>
            <CheckCircle2 className='h-5 w-5 text-emerald-600' />
            <span className='font-bold text-emerald-700'>Booking Confirmed</span>
          </div>
        </div>

        {/* Footer */}
        <div className='bg-slate-50 px-6 py-4 text-center border-t border-slate-100'>
          <p className='text-sm font-semibold text-slate-700'>Divine Mercy Retreat Center</p>
          <p className='text-xs text-slate-500 mt-1'>Present this ticket at check-in</p>
        </div>
      </div>

      {/* Download Button */}
      <div className='flex justify-center'>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className='inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
        >
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





