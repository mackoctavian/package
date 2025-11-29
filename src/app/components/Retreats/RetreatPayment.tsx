'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, ShieldCheck, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'

import type { RetreatType } from '@/app/types/retreat'
import type { RetreatBooking } from '@/app/types/retreat-booking'

type PaymentMethod = 'card' | 'mobile'

const formatter = typeof Intl !== 'undefined' ? new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS' }) : null

interface RetreatPaymentProps {
  retreat: RetreatType
  booking: RetreatBooking
}

const mobileNetworks = ['Vodacom M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Halopesa']
const cardLogos = ['Visa', 'Mastercard', 'American Express']

const RetreatPayment = ({ retreat, booking }: RetreatPaymentProps) => {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [isProcessing, setIsProcessing] = useState(false)

  const amount = useMemo(() => {
    if (retreat.isPaid === false) return 'Sponsored / Free'
    return formatter?.format(retreat.price ?? 0) ?? `${retreat.price ?? 0} TSh`
  }, [retreat.isPaid, retreat.price])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isProcessing) return

    setIsProcessing(true)

    setTimeout(() => {
      toast.success('Payment successful!')
      router.push(`/retreats/${retreat.slug}/payment/success?booking=${booking.id}`)
    }, 1200)
  }

  const renderPaymentFields = () => {
    if (retreat.isPaid === false) {
      return (
        <div className='space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800'>
          <ShieldCheck className='h-6 w-6' />
          <div>
            <p className='text-sm font-semibold uppercase tracking-wide text-emerald-700'>No payment required</p>
            <p className='mt-2 text-sm'>This retreat is fully sponsored for registered guests. Click the button below to confirm your attendance.</p>
          </div>
        </div>
      )
    }

    if (method === 'mobile') {
      return (
        <div className='space-y-5'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <label className='text-xs font-semibold uppercase tracking-wide text-slate-600'>Mobile network</label>
              <select className='mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'>
                {mobileNetworks.map((network) => (
                  <option key={network} value={network}>
                    {network}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='text-xs font-semibold uppercase tracking-wide text-slate-600'>Mobile number</label>
              <input
                type='tel'
                placeholder='07XX XXX XXX'
                className='mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                required
              />
            </div>
          </div>
          <div className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500'>
            A secure payment request will be initiated to your mobile wallet. Confirm the prompt on your device to complete the payment.
          </div>
        </div>
      )
    }

    return (
      <div className='space-y-5'>
        <div>
          <label className='text-xs font-semibold uppercase tracking-wide text-slate-600'>Cardholder name</label>
          <input
            type='text'
            placeholder='Name on card'
            className='mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
            required
          />
        </div>
        <div>
          <label className='text-xs font-semibold uppercase tracking-wide text-slate-600'>Card number</label>
          <input
            type='text'
            inputMode='numeric'
            placeholder='4242 4242 4242 4242'
            className='mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
            required
          />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div>
            <label className='text-xs font-semibold uppercase tracking-wide text-slate-600'>Expiry</label>
            <input
              type='text'
              placeholder='MM / YY'
              className='mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
              required
            />
          </div>
          <div>
            <label className='text-xs font-semibold uppercase tracking-wide text-slate-600'>CVC</label>
            <input
              type='password'
              maxLength={4}
              placeholder='123'
              className='mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
              required
            />
          </div>
        </div>
        <div className='flex flex-wrap gap-2 text-xs text-slate-400'>
          {cardLogos.map((logo) => (
            <span key={logo} className='rounded-full border border-slate-200 px-3 py-1'>
              {logo}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10'>
        <div className='grid gap-10 lg:grid-cols-[1.3fr_1fr]'>
          <div className='space-y-8'>
            <header className='space-y-2'>
              <h1 className='text-3xl font-semibold text-slate-900'>Complete your reservation</h1>
              <p className='text-sm text-slate-500'>Secure payment processing provided for Divine Mercy Retreat Center registrations.</p>
            </header>

            <section className='rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm'>
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.35em] text-slate-500'>Retreat</p>
                  <p className='text-lg font-semibold text-slate-900'>{retreat.title}</p>
                  <p className='text-sm text-slate-500'>{retreat.dateRange}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xs font-semibold uppercase tracking-[0.35em] text-slate-500'>Amount Due</p>
                  <p className='text-2xl font-semibold text-slate-900'>{amount}</p>
                </div>
              </div>
              <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                <div className='rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm'>
                  <p className='text-xs uppercase tracking-wide text-slate-500'>Booking reference</p>
                  <p className='font-semibold text-slate-900'>{booking.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className='rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm'>
                  <p className='text-xs uppercase tracking-wide text-slate-500'>Guest</p>
                  <p className='font-semibold text-slate-900'>{booking.fullName}</p>
                </div>
              </div>
            </section>

            <form onSubmit={handleSubmit} className='space-y-6'>
              {retreat.isPaid !== false ? (
                <div className='grid gap-4 sm:grid-cols-2'>
                  <button
                    type='button'
                    onClick={() => setMethod('card')}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      method === 'card'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary'
                    }`}>
                    <CreditCard className='h-5 w-5' />
                    Card payment
                  </button>
                  <button
                    type='button'
                    onClick={() => setMethod('mobile')}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      method === 'mobile'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary'
                    }`}>
                    <Smartphone className='h-5 w-5' />
                    Mobile money
                  </button>
                </div>
              ) : null}

              {renderPaymentFields()}

              <button
                type='submit'
                disabled={isProcessing}
                className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70'>
                <ShieldCheck className='h-4 w-4' />
                {retreat.isPaid === false ? 'Confirm registration' : isProcessing ? 'Processing payment…' : 'Pay securely'}
              </button>
            </form>
          </div>

          <aside className='space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-slate-900'>Secure checkout</h2>
            <p className='text-sm text-slate-500'>All transactions are encrypted. We never store payment details.</p>
            <div className='space-y-3 text-sm text-slate-600'>
              <div className='flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'>
                <ShieldCheck className='h-5 w-5 text-emerald-500' />
                <span>SSL 256-bit encryption</span>
              </div>
              <div className='flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'>
                <CreditCard className='h-5 w-5 text-primary' />
                <span>Card payments processed via secure gateway</span>
              </div>
              <div className='flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'>
                <Smartphone className='h-5 w-5 text-primary' />
                <span>Support for major Tanzanian mobile wallets</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default RetreatPayment
