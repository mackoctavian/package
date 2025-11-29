'use client'

import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, MapPin, User, Mail, Phone, Download, Ticket, CheckCircle2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'

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
}

export default function RetreatTicket({ booking, retreat }: RetreatTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null)

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
      link.click()
    } catch (error) {
      console.error('Failed to download ticket:', error)
    }
  }

  return (
    <div className='space-y-4'>
      {/* Ticket */}
      <div 
        ref={ticketRef}
        className='bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200 max-w-md mx-auto'
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white'>
          <div className='flex items-center gap-2 mb-2'>
            <Ticket className='h-5 w-5' />
            <span className='text-sm font-medium opacity-90'>Retreat Ticket</span>
          </div>
          <h2 className='text-2xl font-bold'>{retreat.title}</h2>
        </div>

        {/* QR Code Section */}
        <div className='p-6 bg-slate-50 flex flex-col items-center'>
          <div className='bg-white p-4 rounded-xl shadow-sm border border-slate-100'>
            <QRCodeSVG
              value={booking.ticketCode}
              size={180}
              level='H'
              includeMargin
              imageSettings={{
                src: '/images/dmrc/logo.png',
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          </div>
          <p className='mt-4 text-2xl font-mono font-bold text-slate-900 tracking-wider'>
            {booking.ticketCode}
          </p>
          <p className='text-sm text-slate-500 mt-1'>Scan to check in</p>
        </div>

        {/* Details */}
        <div className='p-6 space-y-4'>
          {/* Attendee Info */}
          <div className='space-y-2'>
            <div className='flex items-center gap-3 text-slate-600'>
              <User className='h-4 w-4 text-slate-400' />
              <span className='font-medium text-slate-900'>{booking.fullName}</span>
            </div>
            <div className='flex items-center gap-3 text-slate-600'>
              <Mail className='h-4 w-4 text-slate-400' />
              <span className='text-sm'>{booking.email}</span>
            </div>
            <div className='flex items-center gap-3 text-slate-600'>
              <Phone className='h-4 w-4 text-slate-400' />
              <span className='text-sm'>{booking.phone}</span>
            </div>
          </div>

          {/* Divider */}
          <div className='border-t border-dashed border-slate-200 relative'>
            <div className='absolute -left-6 -top-3 w-6 h-6 bg-slate-100 rounded-full' />
            <div className='absolute -right-6 -top-3 w-6 h-6 bg-slate-100 rounded-full' />
          </div>

          {/* Retreat Info */}
          <div className='space-y-2'>
            <div className='flex items-center gap-3 text-slate-600'>
              <CalendarDays className='h-4 w-4 text-blue-500' />
              <div>
                <span className='font-medium text-slate-900'>{retreat.dateRange}</span>
                {retreat.timeRange && (
                  <p className='text-xs text-slate-500'>{retreat.timeRange}</p>
                )}
              </div>
            </div>
            <div className='flex items-center gap-3 text-slate-600'>
              <MapPin className='h-4 w-4 text-blue-500' />
              <span>{retreat.location}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className='flex items-center justify-center gap-2 py-3 bg-green-50 rounded-xl text-green-700'>
            <CheckCircle2 className='h-5 w-5' />
            <span className='font-semibold'>Booking Confirmed</span>
          </div>
        </div>

        {/* Footer */}
        <div className='bg-slate-50 px-6 py-4 text-center border-t border-slate-100'>
          <p className='text-xs text-slate-500'>
            Divine Mercy Retreat Center
          </p>
          <p className='text-xs text-slate-400 mt-1'>
            Please present this ticket at check-in
          </p>
        </div>
      </div>

      {/* Download Button */}
      <div className='flex justify-center'>
        <Button onClick={handleDownload} className='gap-2'>
          <Download className='h-4 w-4' />
          Download Ticket
        </Button>
      </div>
    </div>
  )
}

