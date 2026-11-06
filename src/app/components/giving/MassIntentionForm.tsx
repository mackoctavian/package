'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CheckCircle2, Cross, Flame, Heart, Loader2, Minus, Plus, Sparkles, Users } from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import MockCheckout from '@/app/components/giving/MockCheckout'
import { CheckboxCard, Field, inputClass } from '@/app/components/site/FormFields'
import { cn } from '@/lib/utils'

export const SUGGESTED_OFFERING_PER_MASS = 10000

const intentionTypes = [
  { id: 'thanksgiving', label: 'Thanksgiving', icon: Sparkles, description: 'For blessings received' },
  { id: 'healing', label: 'Healing', icon: Heart, description: 'Body, mind or spirit' },
  { id: 'deceased', label: 'Repose of a soul', icon: Cross, description: 'For the faithful departed' },
  { id: 'family', label: 'Family', icon: Users, description: 'Blessing on your family' },
  { id: 'special', label: 'Special intention', icon: Flame, description: 'Any other intention' },
] as const

type IntentionType = (typeof intentionTypes)[number]['id']

const forPlaceholder: Record<IntentionType, string> = {
  thanksgiving: 'e.g. The Mushi family',
  healing: 'e.g. Grace Mwakyusa',
  deceased: 'e.g. The late Joseph Komba (†2024)',
  family: 'e.g. The Kimaro family',
  special: 'e.g. My sister Neema',
}

const initial = {
  intentionType: 'thanksgiving' as IntentionType,
  intentionFor: '',
  intentionDetails: '',
  preferredDate: '',
  numberOfMasses: 1,
  donationAmount: '',
  fullName: '',
  email: '',
  phone: '',
  acceptTerms: false,
}

type FormState = typeof initial
type Errors = Partial<Record<keyof FormState, string>>

const formatTzs = (value: number) => `TZS ${value.toLocaleString('en-US')}`

export default function MassIntentionForm() {
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<FormState | null>(null)
  const [paying, setPaying] = useState<'no' | 'checkout' | 'paid'>('no')

  const suggested = form.numberOfMasses * SUGGESTED_OFFERING_PER_MASS
  const minDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }, [])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = () => {
    const next: Errors = {}
    if (!form.intentionFor.trim()) next.intentionFor = 'Who should the Mass be offered for?'
    if (!form.intentionDetails.trim()) next.intentionDetails = 'Please write your intention.'
    if (!form.fullName.trim()) next.fullName = 'Please enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Please enter a valid email address.'
    if (!/^[0-9+\s-]{7,16}$/.test(form.phone.trim())) next.phone = 'Please enter a valid phone number.'
    if (!form.acceptTerms) next.acceptTerms = 'Please confirm to continue.'
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) document.getElementById(`mi-${first}`)?.focus()
    return !first
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const response = await fetch('/api/mass-intentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          donationAmount: form.donationAmount || String(suggested),
          metadata: { source: 'mass-intentions' },
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? 'We could not send your intention right now.')
      setSubmitted({ ...form, donationAmount: form.donationAmount || String(suggested) })
      setPaying('no')
      setForm(initial)
      document.getElementById('intention-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'We could not send your intention right now.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    const type = intentionTypes.find((t) => t.id === submitted.intentionType)
    return (
      <div id='intention-form' className='scroll-mt-28 rounded-[2rem] border border-border bg-white p-8 text-center shadow-soft sm:p-12'>
        <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'>
          <CheckCircle2 className='h-8 w-8' />
        </span>
        <h2 className='mt-5 text-4xl'>Your intention has been received</h2>
        <p className='mx-auto mt-3 max-w-md text-muted-foreground'>
          We will confirm the date by email to {submitted.email}. Thank you for entrusting this intention to our prayers.
        </p>
        <dl className='mx-auto mt-8 max-w-md divide-y divide-border rounded-2xl border border-border text-left text-sm'>
          {[
            ['Intention', type?.label],
            ['Offered for', submitted.intentionFor],
            ['Masses', String(submitted.numberOfMasses)],
            ['Preferred date', submitted.preferredDate ? new Date(submitted.preferredDate).toLocaleDateString('en-GB', { dateStyle: 'long' }) : 'Next available'],
            ['Offering', formatTzs(Number(submitted.donationAmount) || 0)],
          ].map(([label, value]) => (
            <div key={label} className='flex justify-between gap-4 px-5 py-3'>
              <dt className='text-muted-foreground'>{label}</dt>
              <dd className='text-right font-medium text-navy-900'>{value}</dd>
            </div>
          ))}
        </dl>
        {paying === 'checkout' ? (
          <div className='mx-auto mt-8 max-w-lg text-left'>
            <MockCheckout
              amount={Number(submitted.donationAmount) || SUGGESTED_OFFERING_PER_MASS}
              reference={`MASS-${submitted.fullName.slice(0, 3).toUpperCase()}${submitted.numberOfMasses}`}
              description='Mass offering'
              defaultPhone={submitted.phone}
              onBack={() => setPaying('no')}
              onPaid={() => setPaying('paid')}
            />
          </div>
        ) : paying === 'paid' ? (
          <p className='mx-auto mt-8 max-w-md rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-800'>
            Thank you — your offering has been received.
          </p>
        ) : (
          <Button variant='gold' size='xl' className='mt-8' onClick={() => setPaying('checkout')}>
            Pay offering online
          </Button>
        )}
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          <Button variant='outline' size='pill' onClick={() => setSubmitted(null)}>
            Request another Mass
          </Button>
          <Button asChild size='pill'>
            <Link href='/retreats'>See upcoming retreats</Link>
          </Button>
        </div>
      </div>
    )
  }

  const stepTitle = (n: number, title: string) => (
    <h3 className='mb-4 flex items-center gap-3 font-display text-2xl font-semibold text-navy-900'>
      <span className='flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 font-sans text-sm text-gold-200'>{n}</span>
      {title}
    </h3>
  )

  return (
    <form id='intention-form' noValidate onSubmit={submit} className='scroll-mt-28 space-y-10 rounded-[2rem] border border-border bg-white p-6 shadow-soft sm:p-10'>
      <fieldset className='space-y-5'>
        <legend className='contents'>{stepTitle(1, 'Choose an intention')}</legend>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {intentionTypes.map((type) => {
            const active = form.intentionType === type.id
            return (
              <label
                key={type.id}
                className={cn(
                  'cursor-pointer rounded-2xl border p-4 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gold-200',
                  active ? 'border-navy-900 bg-navy-900 text-white' : 'border-border bg-ivory hover:border-navy-200',
                )}
              >
                <input
                  type='radio'
                  name='intentionType'
                  className='sr-only'
                  checked={active}
                  onChange={() => update('intentionType', type.id)}
                />
                <type.icon className={cn('h-5 w-5', active ? 'text-gold-300' : 'text-gold-600')} />
                <span className='mt-3 block font-semibold'>{type.label}</span>
                <span className={cn('mt-0.5 block text-xs', active ? 'text-navy-200' : 'text-muted-foreground')}>{type.description}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className='space-y-5'>
        <legend className='contents'>{stepTitle(2, 'Your intention')}</legend>
        <Field label='Offered for' htmlFor='mi-intentionFor' required error={errors.intentionFor}>
          <input
            id='mi-intentionFor'
            aria-invalid={!!errors.intentionFor || undefined}
            className={inputClass}
            value={form.intentionFor}
            placeholder={forPlaceholder[form.intentionType]}
            onChange={(e) => update('intentionFor', e.target.value)}
          />
        </Field>
        <Field label='Intention' htmlFor='mi-intentionDetails' required error={errors.intentionDetails} hint='Kept confidential; read only by the celebrant.'>
          <textarea
            id='mi-intentionDetails'
            aria-invalid={!!errors.intentionDetails || undefined}
            rows={4}
            maxLength={2000}
            className={cn(inputClass, 'resize-none')}
            value={form.intentionDetails}
            onChange={(e) => update('intentionDetails', e.target.value)}
          />
        </Field>
      </fieldset>

      <fieldset className='space-y-5'>
        <legend className='contents'>{stepTitle(3, 'Date & offering')}</legend>
        <div className='grid gap-5 sm:grid-cols-2'>
          <Field label='Preferred date' htmlFor='mi-preferredDate' hint='Leave empty for the next available Mass.'>
            <input
              id='mi-preferredDate'
              type='date'
              min={minDate}
              className={inputClass}
              value={form.preferredDate}
              onChange={(e) => update('preferredDate', e.target.value)}
            />
          </Field>
          <Field label='Number of Masses'>
            <div className='flex h-[50px] items-center justify-between rounded-xl border border-input bg-white px-2'>
              <button
                type='button'
                aria-label='Fewer Masses'
                disabled={form.numberOfMasses <= 1}
                onClick={() => update('numberOfMasses', form.numberOfMasses - 1)}
                className='rounded-lg p-2 text-navy-700 hover:bg-parchment disabled:opacity-40'
              >
                <Minus className='h-4 w-4' />
              </button>
              <span className='font-semibold text-navy-900' aria-live='polite'>
                {form.numberOfMasses} {form.numberOfMasses === 1 ? 'Mass' : 'Masses'}
              </span>
              <button
                type='button'
                aria-label='More Masses'
                disabled={form.numberOfMasses >= 30}
                onClick={() => update('numberOfMasses', form.numberOfMasses + 1)}
                className='rounded-lg p-2 text-navy-700 hover:bg-parchment disabled:opacity-40'
              >
                <Plus className='h-4 w-4' />
              </button>
            </div>
          </Field>
        </div>
        <Field label='Your offering (TZS)' htmlFor='mi-donationAmount' hint={`Free-will offering. Customary: ${formatTzs(SUGGESTED_OFFERING_PER_MASS)} per Mass.`}>
          <div className='relative'>
            <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>TZS</span>
            <input
              id='mi-donationAmount'
              inputMode='numeric'
              className={cn(inputClass, 'pl-14')}
              placeholder={suggested.toLocaleString('en-US')}
              value={form.donationAmount ? Number(form.donationAmount).toLocaleString('en-US') : ''}
              onChange={(e) => update('donationAmount', e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
            />
          </div>
        </Field>
      </fieldset>

      <fieldset className='space-y-5'>
        <legend className='contents'>{stepTitle(4, 'Your details')}</legend>
        <Field label='Full name' htmlFor='mi-fullName' required error={errors.fullName}>
          <input
            id='mi-fullName'
            autoComplete='name'
            aria-invalid={!!errors.fullName || undefined}
            className={inputClass}
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
          />
        </Field>
        <div className='grid gap-5 sm:grid-cols-2'>
          <Field label='Email' htmlFor='mi-email' required error={errors.email}>
            <input
              id='mi-email'
              type='email'
              autoComplete='email'
              aria-invalid={!!errors.email || undefined}
              className={inputClass}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </Field>
          <Field label='Phone' htmlFor='mi-phone' required error={errors.phone}>
            <input
              id='mi-phone'
              type='tel'
              autoComplete='tel'
              placeholder='+255 7XX XXX XXX'
              aria-invalid={!!errors.phone || undefined}
              className={inputClass}
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </Field>
        </div>
        <CheckboxCard id='mi-acceptTerms' checked={form.acceptTerms} onChange={(v) => update('acceptTerms', v)} error={errors.acceptTerms}>
          I understand the date may be adjusted to the nearest available Mass, and I agree to DMRC contacting me about this request.
        </CheckboxCard>
      </fieldset>

      {submitError && (
        <p role='alert' className='rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700'>
          {submitError}
        </p>
      )}

      <div className='flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center'>
        <p className='text-sm text-muted-foreground'>
          Offering: <span className='font-semibold text-navy-900'>{formatTzs(Number(form.donationAmount) || suggested)}</span>
        </p>
        <Button type='submit' size='xl' disabled={submitting} className='w-full sm:w-auto'>
          {submitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Flame className='mr-2 h-4 w-4' />}
          Submit intention
        </Button>
      </div>
    </form>
  )
}
