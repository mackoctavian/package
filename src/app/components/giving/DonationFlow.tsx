'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

import { givingFunds } from '@/app/data/giving'

import { Button } from '@/app/components/ui/button'
import { Field, inputClass } from '@/app/components/site/FormFields'
import MockCheckout from '@/app/components/giving/MockCheckout'
import { cn } from '@/lib/utils'

const funds = givingFunds

const presets = [10000, 25000, 50000, 100000, 250000]

type Step = 'gift' | 'details' | 'payment' | 'done'

const makeReference = () => `GIFT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

export default function DonationFlow() {
  const [step, setStep] = useState<Step>('gift')
  const [fund, setFund] = useState<(typeof funds)[number]['id']>('general')
  const [preset, setPreset] = useState<number | null>(50000)
  const [custom, setCustom] = useState('')
  const [details, setDetails] = useState({ fullName: '', email: '', phone: '', prayerIntention: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [reference] = useState(makeReference)

  const amount = useMemo(() => (custom ? Number(custom) : preset) || 0, [custom, preset])
  const fundLabel = funds.find((f) => f.id === fund)?.label ?? ''

  const stepIndex = ['gift', 'details', 'payment'].indexOf(step)

  const continueFromGift = () => {
    if (amount < 1000) {
      setErrors({ amount: 'Please choose an amount of at least TZS 1,000.' })
      return
    }
    setErrors({})
    setStep('details')
  }

  const continueFromDetails = () => {
    const next: Record<string, string> = {}
    if (!details.fullName.trim()) next.fullName = 'Please enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) next.email = 'Please enter a valid email address.'
    if (!/^[0-9+\s-]{7,16}$/.test(details.phone.trim())) next.phone = 'Please enter a valid phone number.'
    setErrors(next)
    if (Object.keys(next).length) return
    setStep('payment')
  }

  const recordDonation = async (method: 'mobile' | 'card' | 'bank') => {
    setSaving(true)
    setSaveError(null)
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...details,
          amount,
          currency: 'TZS',
          paymentMethod: method,
          metadata: { source: 'donation-page', fund, reference, demoCheckout: true },
        }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'We could not record your gift.')
      }
      setStep('done')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'We could not record your gift.')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'done') {
    return (
      <div className='rounded-[2rem] border border-border bg-white p-8 text-center shadow-soft sm:p-12'>
        <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'>
          <CheckCircle2 className='h-8 w-8' />
        </span>
        <h2 className='mt-5 text-4xl'>Thank you, {details.fullName.split(' ')[0]}</h2>
        <p className='mx-auto mt-3 max-w-md text-muted-foreground'>
          Your gift of <strong className='text-navy-900'>TZS {amount.toLocaleString('en-US')}</strong> to {fundLabel.toLowerCase()} has
          been recorded. A receipt will be sent to {details.email}. You are remembered in our daily prayers.
        </p>
        <p className='mt-4 font-mono text-xs text-muted-foreground'>Reference {reference}</p>
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          <Button asChild variant='outline' size='pill'>
            <Link href='/mass-intentions'>Request a Mass intention</Link>
          </Button>
          <Button asChild size='pill'>
            <Link href='/'>Back to home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft'>
      <ol className='grid grid-cols-3 border-b border-border bg-parchment/60 text-center text-xs font-medium' aria-label='Giving progress'>
        {['Your gift', 'Your details', 'Payment'].map((label, i) => (
          <li
            key={label}
            aria-current={i === stepIndex ? 'step' : undefined}
            className={cn('border-b-2 px-2 py-4', i === stepIndex ? 'border-gold-400 text-navy-900' : i < stepIndex ? 'border-navy-900 text-navy-900' : 'border-transparent text-muted-foreground')}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div className='p-6 sm:p-8'>
        {step === 'gift' && (
          <div className='space-y-8'>
            <fieldset>
              <legend className='mb-3 text-sm font-medium text-navy-800'>Choose where your gift goes</legend>
              <div className='grid gap-3 sm:grid-cols-2'>
                {funds.map((item) => {
                  const active = fund === item.id
                  return (
                    <label
                      key={item.id}
                      className={cn(
                        'flex cursor-pointer gap-3 rounded-2xl border p-4 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gold-200',
                        active ? 'border-navy-900 bg-navy-50' : 'border-border hover:border-navy-200',
                      )}
                    >
                      <input type='radio' name='fund' className='sr-only' checked={active} onChange={() => setFund(item.id)} />
                      <item.icon className={cn('mt-0.5 h-5 w-5 shrink-0', active ? 'text-navy-900' : 'text-gold-600')} />
                      <span>
                        <span className='block font-semibold text-navy-900'>{item.label}</span>
                        <span className='mt-0.5 block text-xs text-muted-foreground'>{item.text}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className='mb-3 text-sm font-medium text-navy-800'>Amount (TZS)</legend>
              <div className='grid grid-cols-3 gap-2 sm:grid-cols-5'>
                {presets.map((value) => {
                  const active = !custom && preset === value
                  return (
                    <button
                      key={value}
                      type='button'
                      aria-pressed={active}
                      onClick={() => {
                        setPreset(value)
                        setCustom('')
                        setErrors({})
                      }}
                      className={cn(
                        'rounded-xl border py-3 text-sm font-semibold transition',
                        active ? 'border-navy-900 bg-navy-900 text-white' : 'border-border bg-white text-navy-800 hover:border-navy-300',
                      )}
                    >
                      {value.toLocaleString('en-US')}
                    </button>
                  )
                })}
              </div>
              <div className='relative mt-3'>
                <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>TZS</span>
                <input
                  aria-label='Other amount'
                  inputMode='numeric'
                  placeholder='Other amount'
                  className={cn(inputClass, 'pl-14')}
                  value={custom ? Number(custom).toLocaleString('en-US') : ''}
                  onChange={(e) => {
                    setCustom(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))
                    setErrors({})
                  }}
                />
              </div>
              {errors.amount && (
                <p role='alert' className='mt-2 text-sm text-red-600'>
                  {errors.amount}
                </p>
              )}
            </fieldset>

            <div className='flex items-center justify-between border-t border-border pt-6'>
              <p className='text-sm text-muted-foreground'>
                Giving <span className='font-semibold text-navy-900'>TZS {amount.toLocaleString('en-US')}</span>
              </p>
              <Button size='xl' onClick={continueFromGift}>
                Continue <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className='space-y-5'>
            <Field label='Full name' htmlFor='d-name' required error={errors.fullName}>
              <input
                id='d-name'
                autoComplete='name'
                className={inputClass}
                value={details.fullName}
                onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
              />
            </Field>
            <div className='grid gap-5 sm:grid-cols-2'>
              <Field label='Email' htmlFor='d-email' required error={errors.email} hint='For your receipt.'>
                <input
                  id='d-email'
                  type='email'
                  autoComplete='email'
                  className={inputClass}
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                />
              </Field>
              <Field label='Phone' htmlFor='d-phone' required error={errors.phone}>
                <input
                  id='d-phone'
                  type='tel'
                  autoComplete='tel'
                  placeholder='+255 7XX XXX XXX'
                  className={inputClass}
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                />
              </Field>
            </div>
            <Field label='Prayer intention' htmlFor='d-intention' hint='Optional. Our community prays for every benefactor.'>
              <textarea
                id='d-intention'
                rows={3}
                maxLength={2000}
                className={cn(inputClass, 'resize-none')}
                value={details.prayerIntention}
                onChange={(e) => setDetails({ ...details, prayerIntention: e.target.value })}
              />
            </Field>
            <div className='flex items-center justify-between border-t border-border pt-6'>
              <Button variant='ghost' onClick={() => setStep('gift')}>
                Back
              </Button>
              <Button size='xl' onClick={continueFromDetails}>
                Continue to payment <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' &&
          (saving ? (
            <div className='flex flex-col items-center py-14' role='status'>
              <Loader2 className='h-8 w-8 animate-spin text-gold-500' />
              <p className='mt-4 text-muted-foreground'>Recording your gift…</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {saveError && (
                <p role='alert' className='rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700'>
                  {saveError}
                </p>
              )}
              <MockCheckout
                amount={amount}
                reference={reference}
                description={fundLabel}
                defaultPhone={details.phone}
                onBack={() => setStep('details')}
                onPaid={({ method }) => recordDonation(method)}
              />
            </div>
          ))}
      </div>
    </div>
  )
}
