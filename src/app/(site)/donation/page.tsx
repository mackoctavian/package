'use client'

import { useMemo, useState } from 'react'

const presetAmounts = [50000, 100000, 200000, 500000]
const paymentOptions = [
  { id: 'card', label: 'Card Payment', description: 'Visa, Mastercard, Amex' },
  { id: 'mobile', label: 'Mobile Money', description: 'M-Pesa, Tigo Pesa, Airtel Money' },
  { id: 'bank', label: 'Bank Transfer', description: 'Direct bank transfer instructions' },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(value)

export default function DonationPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(presetAmounts[0])
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0].id)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle')

  const amount = useMemo(() => {
    if (customAmount) {
      const parsed = Number(customAmount.replace(/[^0-9]/g, ''))
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }
    return selectedAmount
  }, [customAmount, selectedAmount])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!amount) {
      return
    }

    setStatus('submitting')
    setTimeout(() => {
      setStatus('submitted')
    }, 800)
  }

  return (
    <section className='py-28'>
      <div className='w-full px-2 sm:px-4 lg:px-6'>
        <div className='w-full max-w-7xl mx-auto'>
          {/* Header Section */}
          <div className='mb-10 space-y-6'>
            <p className='text-xs font-semibold uppercase tracking-[0.45em] text-primary'>Mission Partner</p>
            <h1 className='text-4xl font-semibold text-slate-900 sm:text-5xl'>
              Sustain Divine Mercy Retreat Center with a gift
            </h1>
            <p className='text-base text-slate-600 max-w-4xl'>
              Every donation fuels evangelisation, retreat scholarships, pastoral counselling, and mercy missions across
              Tanzania. Choose a preset amount or enter a custom gift and we'll guide you through the payment method you
              prefer.
            </p>
          </div>

          {/* Info Section */}
          <div className='mb-10'>
            <div className='rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.1)] max-w-4xl'>
              <h2 className='text-xl font-semibold text-slate-900'>Where your giving goes</h2>
              <ul className='mt-4 space-y-3 text-sm text-slate-600'>
                <li className='flex items-start gap-3'>
                  <span className='mt-1 h-2 w-2 rounded-full bg-primary'></span>
                  Scholarships for families and young adults attending retreats.
                </li>
                <li className='flex items-start gap-3'>
                  <span className='mt-1 h-2 w-2 rounded-full bg-primary'></span>
                  Mercy missions, parish outreach, and counselling services.
                </li>
                <li className='flex items-start gap-3'>
                  <span className='mt-1 h-2 w-2 rounded-full bg-primary'></span>
                  Daily operations of the chapel, prayer house, and hospitality team.
                </li>
              </ul>
              <p className='mt-5 text-sm text-slate-500'>
                DMRC is a registered apostolate. You'll receive an emailed confirmation with your donation summary.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className='rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_24px_65px_rgba(15,23,42,0.12)] max-w-4xl'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.35em] text-primary/70'>Donation Form</p>
                <h2 className='text-2xl font-semibold text-slate-900'>Give securely</h2>
              </div>
              <span className='rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700'>
                SSL Protected
              </span>
            </div>
            <form onSubmit={handleSubmit} className='mt-6 space-y-5'>
              <div>
                <label className='text-sm font-semibold text-slate-700'>Full name</label>
                <input
                  type='text'
                  required
                  placeholder='Jane Doe'
                  className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30'
                />
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='text-sm font-semibold text-slate-700'>Email</label>
                  <input
                    type='email'
                    required
                    placeholder='you@example.com'
                    className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30'
                  />
                </div>
                <div>
                  <label className='text-sm font-semibold text-slate-700'>Phone</label>
                  <input
                    type='tel'
                    required
                    placeholder='+255 700 000 000'
                    className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30'
                  />
                </div>
              </div>

              <div>
                <label className='text-sm font-semibold text-slate-700'>Select an amount</label>
                <div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4'>
                  {presetAmounts.map((value) => (
                    <button
                      type='button'
                      key={value}
                      onClick={() => {
                        setSelectedAmount(value)
                        setCustomAmount('')
                      }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        selectedAmount === value && !customAmount
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 text-slate-700 hover:border-primary/50'
                      }`}>
                      {formatCurrency(value)}
                    </button>
                  ))}
                </div>
                <div className='mt-3'>
                  <label className='text-xs font-medium uppercase tracking-[0.3em] text-slate-500'>Custom amount</label>
                  <div className='mt-2 flex rounded-2xl border border-slate-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'>
                    <span className='flex items-center px-3 text-sm text-slate-500'>TZS</span>
                    <input
                      type='text'
                      inputMode='numeric'
                      pattern='[0-9]*'
                      value={customAmount}
                      onChange={(event) => {
                        setCustomAmount(event.target.value)
                        setSelectedAmount(null)
                      }}
                      placeholder='Enter custom amount'
                      className='w-full rounded-r-2xl bg-transparent px-3 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none'
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className='text-sm font-semibold text-slate-700'>Payment method</label>
                <div className='mt-3 space-y-3'>
                  {paymentOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 ${
                        paymentMethod === option.id ? 'border-primary bg-primary/5' : 'border-slate-200'
                      }`}>
                      <div>
                        <p className='text-sm font-semibold text-slate-900'>{option.label}</p>
                        <p className='text-xs text-slate-500'>{option.description}</p>
                      </div>
                      <input
                        type='radio'
                        name='paymentMethod'
                        value={option.id}
                        checked={paymentMethod === option.id}
                        onChange={() => setPaymentMethod(option.id)}
                        className='h-4 w-4 accent-primary'
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className='text-sm font-semibold text-slate-700'>Leave a prayer intention (optional)</label>
                <textarea
                  rows={3}
                  placeholder='Share a family, parish, or personal intention we can pray for.'
                  className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30'
                />
              </div>

              <button
                type='submit'
                disabled={!amount || status === 'submitting'}
                className='w-full rounded-2xl bg-primary px-5 py-3 text-base font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70'>
                {status === 'submitting'
                  ? 'Processing gift...'
                  : amount
                  ? `Donate ${formatCurrency(amount)}`
                  : 'Enter amount to donate'}
              </button>
              {status === 'submitted' && (
                <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
                  Thank you! Our team will email a confirmation with instructions to finish your {paymentMethod} donation.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
