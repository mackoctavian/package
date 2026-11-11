'use client'

import { Link } from '@/i18n/link'
import { useLocale, useT } from '@/i18n/client'
import { formatDate, formatMoney, formatNumber } from '@/i18n/format'
import { useMemo, useState } from 'react'
import { CheckCircle2, Cross, Flame, Heart, Loader2, Minus, Plus, Sparkles, Users } from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import MockCheckout from '@/app/components/giving/MockCheckout'
import { CheckboxCard, Field, Honeypot, inputClass } from '@/app/components/site/FormFields'
import { cn } from '@/lib/utils'

import { SUGGESTED_OFFERING_PER_MASS } from '@/app/data/giving'

export { SUGGESTED_OFFERING_PER_MASS }

/** Labels, descriptions and placeholders are translated under `giving.mass.types.<id>`. */
const intentionTypes = [
  { id: 'thanksgiving', icon: Sparkles },
  { id: 'healing', icon: Heart },
  { id: 'deceased', icon: Cross },
  { id: 'family', icon: Users },
  { id: 'special', icon: Flame },
] as const

type IntentionType = (typeof intentionTypes)[number]['id']

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

export default function MassIntentionForm() {
  const t = useT()
  const locale = useLocale()
  const formatTzs = (value: number) => formatMoney(value, locale)
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [website, setWebsite] = useState('')
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
    if (!form.intentionFor.trim()) next.intentionFor = t('giving.mass.errors.offeredFor')
    if (!form.intentionDetails.trim()) next.intentionDetails = t('giving.mass.errors.intention')
    if (!form.fullName.trim()) next.fullName = t('giving.mass.errors.name')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = t('giving.mass.errors.email')
    if (!/^[0-9+\s-]{7,16}$/.test(form.phone.trim())) next.phone = t('giving.mass.errors.phone')
    if (!form.acceptTerms) next.acceptTerms = t('giving.mass.errors.accept')
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
          metadata: { source: 'mass-intentions', language: locale },
          website,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? t('giving.mass.errors.submit'))
      setSubmitted({ ...form, donationAmount: form.donationAmount || String(suggested) })
      setPaying('no')
      setForm(initial)
      document.getElementById('intention-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('giving.mass.errors.submit'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div id='intention-form' className='scroll-mt-28 rounded-[2rem] border border-border bg-white p-8 text-center shadow-soft sm:p-12'>
        <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'>
          <CheckCircle2 className='h-8 w-8' />
        </span>
        <h2 className='mt-5 text-4xl'>{t('giving.mass.done.title')}</h2>
        <p className='mx-auto mt-3 max-w-md text-muted-foreground'>{t('giving.mass.done.text', { email: submitted.email })}</p>
        <dl className='mx-auto mt-8 max-w-md divide-y divide-border rounded-2xl border border-border text-left text-sm'>
          {[
            [t('giving.mass.done.intention'), t(`giving.mass.types.${submitted.intentionType}.label`)],
            [t('giving.mass.done.offeredFor'), submitted.intentionFor],
            [t('giving.mass.done.masses'), String(submitted.numberOfMasses)],
            [
              t('giving.mass.done.preferredDate'),
              submitted.preferredDate ? formatDate(submitted.preferredDate, locale) : t('giving.mass.done.nextAvailable'),
            ],
            [t('giving.mass.done.offering'), formatTzs(Number(submitted.donationAmount) || 0)],
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
              description={t('giving.mass.done.checkoutDescription')}
              defaultPhone={submitted.phone}
              onBack={() => setPaying('no')}
              onPaid={() => setPaying('paid')}
            />
          </div>
        ) : paying === 'paid' ? (
          <p className='mx-auto mt-8 max-w-md rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-800'>
            {t('giving.mass.done.paid')}
          </p>
        ) : (
          <Button variant='gold' size='xl' className='mt-8' onClick={() => setPaying('checkout')}>
            {t('giving.mass.done.pay')}
          </Button>
        )}
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          <Button variant='outline' size='pill' onClick={() => setSubmitted(null)}>
            {t('giving.mass.done.another')}
          </Button>
          <Button asChild size='pill'>
            <Link href='/retreats'>{t('giving.mass.done.retreats')}</Link>
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
      <Honeypot value={website} onChange={setWebsite} />
      <fieldset className='space-y-5'>
        <legend className='contents'>{stepTitle(1, t('giving.mass.form.step1'))}</legend>
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
                <type.icon className={cn('h-5 w-5', active ? 'text-gold-300' : 'text-gold-700')} />
                <span className='mt-3 block font-semibold'>{t(`giving.mass.types.${type.id}.label`)}</span>
                <span className={cn('mt-0.5 block text-xs', active ? 'text-navy-200' : 'text-muted-foreground')}>
                  {t(`giving.mass.types.${type.id}.description`)}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className='space-y-5'>
        <legend className='contents'>{stepTitle(2, t('giving.mass.form.step2'))}</legend>
        <Field label={t('giving.mass.form.offeredFor')} htmlFor='mi-intentionFor' required error={errors.intentionFor}>
          <input
            id='mi-intentionFor'
            aria-invalid={!!errors.intentionFor || undefined}
            className={inputClass}
            value={form.intentionFor}
            placeholder={t(`giving.mass.types.${form.intentionType}.placeholder`)}
            onChange={(e) => update('intentionFor', e.target.value)}
          />
        </Field>
        <Field
          label={t('giving.mass.form.intention')}
          htmlFor='mi-intentionDetails'
          required
          error={errors.intentionDetails}
          hint={t('giving.mass.form.intentionHint')}
        >
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
        <legend className='contents'>{stepTitle(3, t('giving.mass.form.step3'))}</legend>
        <div className='grid gap-5 sm:grid-cols-2'>
          <Field label={t('giving.mass.form.preferredDate')} htmlFor='mi-preferredDate' hint={t('giving.mass.form.preferredDateHint')}>
            <input
              id='mi-preferredDate'
              type='date'
              min={minDate}
              className={inputClass}
              value={form.preferredDate}
              onChange={(e) => update('preferredDate', e.target.value)}
            />
          </Field>
          <Field label={t('giving.mass.form.number')}>
            <div className='flex h-[50px] items-center justify-between rounded-xl border border-input bg-white px-2'>
              <button
                type='button'
                aria-label={t('giving.mass.form.fewer')}
                disabled={form.numberOfMasses <= 1}
                onClick={() => update('numberOfMasses', form.numberOfMasses - 1)}
                className='rounded-lg p-2 text-navy-700 hover:bg-parchment disabled:opacity-40'
              >
                <Minus className='h-4 w-4' />
              </button>
              <span className='font-semibold text-navy-900' aria-live='polite'>
                {t('giving.mass.form.masses', { count: form.numberOfMasses })}
              </span>
              <button
                type='button'
                aria-label={t('giving.mass.form.more')}
                disabled={form.numberOfMasses >= 30}
                onClick={() => update('numberOfMasses', form.numberOfMasses + 1)}
                className='rounded-lg p-2 text-navy-700 hover:bg-parchment disabled:opacity-40'
              >
                <Plus className='h-4 w-4' />
              </button>
            </div>
          </Field>
        </div>
        <Field
          label={t('giving.mass.form.offering')}
          htmlFor='mi-donationAmount'
          hint={t('giving.mass.form.offeringHint', { amount: formatTzs(SUGGESTED_OFFERING_PER_MASS) })}
        >
          <div className='relative'>
            <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>TZS</span>
            <input
              id='mi-donationAmount'
              inputMode='numeric'
              className={cn(inputClass, 'pl-14')}
              placeholder={formatNumber(suggested, locale)}
              value={form.donationAmount ? formatNumber(Number(form.donationAmount), locale) : ''}
              onChange={(e) => update('donationAmount', e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
            />
          </div>
        </Field>
      </fieldset>

      <fieldset className='space-y-5'>
        <legend className='contents'>{stepTitle(4, t('giving.mass.form.step4'))}</legend>
        <Field label={t('giving.mass.form.fullName')} htmlFor='mi-fullName' required error={errors.fullName}>
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
          <Field label={t('giving.mass.form.email')} htmlFor='mi-email' required error={errors.email}>
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
          <Field label={t('giving.mass.form.phone')} htmlFor='mi-phone' required error={errors.phone}>
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
          {t('giving.mass.form.accept')}
        </CheckboxCard>
      </fieldset>

      {submitError && (
        <p role='alert' className='rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700'>
          {submitError}
        </p>
      )}

      <div className='flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center'>
        <p className='text-sm text-muted-foreground'>
          {t('giving.mass.form.offeringTotal')} <span className='font-semibold text-navy-900'>{formatTzs(Number(form.donationAmount) || suggested)}</span>
        </p>
        <Button type='submit' size='xl' disabled={submitting} className='w-full sm:w-auto'>
          {submitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Flame className='mr-2 h-4 w-4' />}
          {t('giving.mass.form.submit')}
        </Button>
      </div>
    </form>
  )
}
