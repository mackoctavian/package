'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Calendar, User, Phone, Hash, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw,
  ArrowRight, Sparkles, Clock, MapPin, CreditCard
} from 'lucide-react'

import type { RetreatBooking } from '@/app/types/retreat-booking'
import type { RetreatType } from '@/app/types/retreat'

type FormState = {
  bookingId: string
  fullName: string
  phone: string
}

type MessageState = { type: 'success' | 'error'; text: string } | null

const initialForm: FormState = { bookingId: '', fullName: '', phone: '' }

const normalizePhone = (value: string) => value.replace(/\s+/g, '')

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
  confirmed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Confirmed' },
  cancelled: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Cancelled' },
  rescheduled: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: RefreshCw, label: 'Rescheduled' },
}

const paymentStatusConfig = {
  pending: { color: 'text-amber-600', label: 'Payment Pending' },
  paid: { color: 'text-emerald-600', label: 'Paid' },
  partial: { color: 'text-blue-600', label: 'Partial Payment' },
  refunded: { color: 'text-slate-600', label: 'Refunded' },
}

export default function CheckBookingPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [booking, setBooking] = useState<RetreatBooking | null>(null)
  const [retreats, setRetreats] = useState<RetreatType[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<'cancel' | 'reschedule' | null>(null)
  const [message, setMessage] = useState<MessageState>(null)
  const [rescheduleTo, setRescheduleTo] = useState('')
  const [searchMethod, setSearchMethod] = useState<'id' | 'details'>('id')

  useEffect(() => {
    const loadRetreats = async () => {
      try {
        const response = await fetch('/api/retreats')
        const payload = await response.json()
        setRetreats(payload.data ?? [])
      } catch (error) {
        console.error('[check-booking] failed to load retreat catalog', error)
      }
    }

    loadRetreats()
  }, [])

  useEffect(() => {
    if (booking) {
      setRescheduleTo('')
      setMessage(null)
    }
  }, [booking])

  const eligibleRetreats = useMemo(() => {
    if (!booking) return []
    return retreats.filter((retreat) => retreat.id !== booking.retreatId && retreat.status !== 'Closed')
  }, [booking, retreats])

  const canCancel = Boolean(booking && booking.status !== 'cancelled')
  const canReschedule = Boolean(booking && eligibleRetreats.length > 0)

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)

    const payload: Partial<FormState> = {}
    if (searchMethod === 'id') {
      if (!form.bookingId.trim()) {
        setMessage({ type: 'error', text: 'Please enter your booking ID.' })
        return
      }
      payload.bookingId = form.bookingId.trim()
    } else {
      if (!form.fullName.trim() || !form.phone.trim()) {
        setMessage({ type: 'error', text: 'Please enter both your full name and phone number.' })
        return
      }
      payload.fullName = form.fullName.trim()
      payload.phone = normalizePhone(form.phone)
    }

    setLookupLoading(true)
    try {
      const response = await fetch('/api/retreats/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error ?? 'Booking not found.')
      }

      const data = await response.json()
      setBooking(data.data as RetreatBooking)
      setMessage({ type: 'success', text: 'Booking found! You can manage it below.' })
    } catch (error) {
      setBooking(null)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Booking lookup failed.' })
    } finally {
      setLookupLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!booking) return
    setActionLoading('cancel')
    setMessage(null)
    try {
      const response = await fetch(`/api/retreats/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error ?? 'Unable to cancel booking.')
      }

      const data = await response.json()
      setBooking(data.data as RetreatBooking)
      setMessage({
        type: 'success',
        text: 'Your booking has been cancelled. Please note refunds are not issued, but you can reschedule anytime.',
      })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Cancellation failed.' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReschedule = async () => {
    if (!booking || !rescheduleTo) {
      setMessage({ type: 'error', text: 'Please select a retreat to reschedule into.' })
      return
    }

    const targetRetreat = eligibleRetreats.find((retreat) => retreat.id === rescheduleTo)
    if (!targetRetreat) {
      setMessage({ type: 'error', text: 'That retreat is no longer available.' })
      return
    }

    setActionLoading('reschedule')
    setMessage(null)
    try {
      const response = await fetch(`/api/retreats/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retreatId: targetRetreat.id,
          retreatTitle: targetRetreat.title,
          status: 'rescheduled',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error ?? 'Unable to reschedule booking.')
      }

      const data = await response.json()
      setBooking(data.data as RetreatBooking)
      setMessage({
        type: 'success',
        text: `Successfully rescheduled to ${targetRetreat.title}. Your confirmation will be updated shortly.`,
      })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Reschedule failed.' })
    } finally {
      setActionLoading(null)
    }
  }

  const currentStatus = booking ? statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending : null
  const currentPaymentStatus = booking ? paymentStatusConfig[booking.paymentStatus as keyof typeof paymentStatusConfig] || paymentStatusConfig.pending : null

  return (
    <main className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      {/* Hero Section */}
      <section className='pt-32 pb-16 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[url("/images/banner/Stars.svg")] opacity-10' />
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 rounded-full blur-3xl' />
        
        <div className='container mx-auto max-w-4xl px-4 relative'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center'
          >
            <span className='inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6 border border-white/20'>
              <Search className='w-4 h-4' />
              Booking Management
            </span>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight'>
              Check Your Booking
            </h1>
            <p className='text-lg text-white/70 max-w-2xl mx-auto leading-relaxed'>
              Find your retreat booking to view details, reschedule to another date, or cancel if needed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className='py-12 -mt-8'>
        <div className='container mx-auto max-w-5xl px-4'>
          <div className='grid lg:grid-cols-5 gap-8'>
            {/* Search Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='lg:col-span-2'
            >
              <div className='bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sticky top-32'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center'>
                    <Search className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-slate-900'>Find Booking</h2>
                    <p className='text-sm text-slate-500'>Enter your booking details</p>
                  </div>
                </div>

                {/* Search Method Toggle */}
                <div className='flex bg-slate-100 rounded-xl p-1 mb-6'>
                  <button
                    type='button'
                    onClick={() => setSearchMethod('id')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      searchMethod === 'id'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Hash className='w-4 h-4 inline mr-1.5' />
                    Booking ID
                  </button>
                  <button
                    type='button'
                    onClick={() => setSearchMethod('details')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      searchMethod === 'details'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className='w-4 h-4 inline mr-1.5' />
                    Name & Phone
                  </button>
                </div>

                <form onSubmit={handleLookup} className='space-y-4'>
                  <AnimatePresence mode='wait'>
                    {searchMethod === 'id' ? (
                      <motion.div
                        key='booking-id'
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className='block text-sm font-semibold text-slate-700 mb-2'>
                          Booking ID
                        </label>
                        <div className='relative'>
                          <Hash className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
                          <input
                            type='text'
                            className='w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
                            placeholder='e.g. RBK-42a1ff'
                            value={form.bookingId}
                            onChange={(e) => handleInputChange('bookingId', e.target.value)}
                          />
                        </div>
                        <p className='mt-2 text-xs text-slate-500'>
                          Find this in your confirmation email
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key='name-phone'
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className='space-y-4'
                      >
                        <div>
                          <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            Full Name
                          </label>
                          <div className='relative'>
                            <User className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
                            <input
                              type='text'
                              className='w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
                              placeholder='Name used during booking'
                              value={form.fullName}
                              onChange={(e) => handleInputChange('fullName', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            Phone Number
                          </label>
                          <div className='relative'>
                            <Phone className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
                            <input
                              type='tel'
                              className='w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
                              placeholder='+255 700 000 000'
                              value={form.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type='submit'
                    disabled={lookupLoading}
                    className='w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    {lookupLoading ? (
                      <>
                        <RefreshCw className='w-5 h-5 animate-spin' />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className='w-5 h-5' />
                        Find Booking
                      </>
                    )}
                  </button>
                </form>

                {/* Message */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${
                        message.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      {message.type === 'success' ? (
                        <CheckCircle2 className='w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5' />
                      ) : (
                        <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                      )}
                      <p className={`text-sm ${message.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
                        {message.text}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Help Link */}
                <div className='mt-6 pt-6 border-t border-slate-100 text-center'>
                  <Link
                    href='/retreats'
                    className='text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1'
                  >
                    Need to make a new booking?
                    <ArrowRight className='w-4 h-4' />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Booking Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className='lg:col-span-3'
            >
              <AnimatePresence mode='wait'>
                {booking ? (
                  <motion.div
                    key='booking-found'
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className='space-y-6'
                  >
                    {/* Booking Card */}
                    <div className='bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden'>
                      {/* Header */}
                      <div className='bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6'>
                        <div className='flex items-start justify-between'>
                          <div>
                            <p className='text-indigo-200 text-sm font-medium mb-1'>Retreat Booking</p>
                            <h3 className='text-2xl font-bold text-white'>{booking.retreatTitle}</h3>
                          </div>
                          {currentStatus && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${currentStatus.color}`}>
                              <currentStatus.icon className='w-3.5 h-3.5' />
                              {currentStatus.label}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className='p-8'>
                        <div className='grid sm:grid-cols-2 gap-6 mb-8'>
                          <div className='space-y-4'>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center'>
                                <Hash className='w-5 h-5 text-slate-600' />
                              </div>
                              <div>
                                <p className='text-xs text-slate-500 uppercase tracking-wider'>Reference</p>
                                <p className='font-semibold text-slate-900'>{booking.id}</p>
                              </div>
                            </div>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center'>
                                <User className='w-5 h-5 text-slate-600' />
                              </div>
                              <div>
                                <p className='text-xs text-slate-500 uppercase tracking-wider'>Booked By</p>
                                <p className='font-semibold text-slate-900'>{booking.fullName}</p>
                              </div>
                            </div>
                          </div>
                          <div className='space-y-4'>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center'>
                                <Phone className='w-5 h-5 text-slate-600' />
                              </div>
                              <div>
                                <p className='text-xs text-slate-500 uppercase tracking-wider'>Phone</p>
                                <p className='font-semibold text-slate-900'>{booking.phone}</p>
                              </div>
                            </div>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center'>
                                <CreditCard className='w-5 h-5 text-slate-600' />
                              </div>
                              <div>
                                <p className='text-xs text-slate-500 uppercase tracking-wider'>Payment</p>
                                <p className={`font-semibold ${currentPaymentStatus?.color}`}>
                                  {currentPaymentStatus?.label}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rescheduled Info */}
                        {booking.rescheduledToRetreatTitle && (
                          <div className='p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6'>
                            <div className='flex items-center gap-2 text-blue-700 mb-1'>
                              <RefreshCw className='w-4 h-4' />
                              <span className='text-sm font-semibold'>Rescheduled To</span>
                            </div>
                            <p className='text-blue-900 font-medium'>{booking.rescheduledToRetreatTitle}</p>
                            {booking.rescheduledAt && (
                              <p className='text-blue-600 text-sm mt-1'>
                                on {new Date(booking.rescheduledAt).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className='space-y-4 pt-6 border-t border-slate-100'>
                          {/* Cancel Button */}
                          <button
                            onClick={handleCancel}
                            disabled={actionLoading === 'cancel' || !canCancel}
                            className='w-full py-3.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                          >
                            {actionLoading === 'cancel' ? (
                              <>
                                <RefreshCw className='w-5 h-5 animate-spin' />
                                Cancelling...
                              </>
                            ) : canCancel ? (
                              <>
                                <XCircle className='w-5 h-5' />
                                Cancel Booking (No Refund)
                              </>
                            ) : (
                              <>
                                <XCircle className='w-5 h-5' />
                                Already Cancelled
                              </>
                            )}
                          </button>

                          {/* Reschedule Section */}
                          <div className='bg-slate-50 rounded-2xl p-5'>
                            <div className='flex items-center gap-2 mb-4'>
                              <Calendar className='w-5 h-5 text-indigo-600' />
                              <span className='font-semibold text-slate-900'>Reschedule Instead</span>
                            </div>
                            
                            {canReschedule ? (
                              <>
                                <select
                                  className='w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3 cursor-pointer'
                                  value={rescheduleTo}
                                  onChange={(e) => setRescheduleTo(e.target.value)}
                                >
                                  <option value=''>Select another retreat...</option>
                                  {eligibleRetreats.map((retreat) => (
                                    <option key={retreat.id} value={retreat.id}>
                                      {retreat.title} · {retreat.dateRange}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={handleReschedule}
                                  disabled={actionLoading === 'reschedule' || !rescheduleTo}
                                  className='w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                                >
                                  {actionLoading === 'reschedule' ? (
                                    <>
                                      <RefreshCw className='w-5 h-5 animate-spin' />
                                      Rescheduling...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className='w-5 h-5' />
                                      Confirm Reschedule
                                    </>
                                  )}
                                </button>
                              </>
                            ) : (
                              <p className='text-sm text-slate-500'>
                                No alternate retreats available for rescheduling at this time.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Warning Note */}
                    <div className='bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4'>
                      <AlertCircle className='w-6 h-6 text-amber-600 flex-shrink-0' />
                      <div>
                        <h4 className='font-semibold text-amber-900 mb-1'>Important Notice</h4>
                        <p className='text-sm text-amber-800'>
                          Cancellations are final and refunds are not issued. However, you can reschedule to any available retreat at no additional cost.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key='no-booking'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='h-full'
                  >
                    <div className='bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center'>
                      <div className='w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6'>
                        <Search className='w-10 h-10 text-indigo-500' />
                      </div>
                      <h3 className='text-2xl font-bold text-slate-900 mb-3'>Find Your Booking</h3>
                      <p className='text-slate-500 max-w-sm mb-8'>
                        Enter your booking ID or registration details in the search form to view and manage your retreat booking.
                      </p>
                      <div className='flex flex-wrap items-center justify-center gap-4'>
                        <Link
                          href='/retreats'
                          className='inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors'
                        >
                          <Sparkles className='w-5 h-5' />
                          Book a Retreat
                        </Link>
                        <Link
                          href='/'
                          className='inline-flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors'
                        >
                          Back to Home
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  )
}
