'use client'

import { Link } from '@/i18n/link'
import { useLocale, useT } from '@/i18n/client'
import { formatDate, formatMoney } from '@/i18n/format'
import type { Locale } from '@/i18n/config'
import { localizeDateRange } from '@/lib/retreats/dates'
import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'

import RetreatTicket from '@/app/components/Retreats/RetreatTicket'
import { Button } from '@/app/components/ui/button'
import type { RetreatType } from '@/app/types/retreat'
import { cn } from '@/lib/utils'
import { Choice, CheckboxCard, Field, Honeypot, inputClass } from '@/app/components/site/FormFields'
import { retreatTerms } from './terms'

type T = ReturnType<typeof useT>

/* ----------------------------------------------------------------------------
 * State
 * Field names match the previous form so admin views and emails keep working.
 * ------------------------------------------------------------------------- */

type FamilyMember = { name: string; relationship: string; age: string }

type FormState = {
  fullName: string
  gender: string
  dob: string
  age: string
  lifeStatus: string
  currentStatus: string
  occupation: string
  nonCatholic: boolean
  phone: string
  whatsappSame: boolean
  whatsapp: string
  altPhone: string
  email: string
  houseName: string
  place: string
  district: string
  state: string
  country: string
  diocese: string
  parish: string
  familyMembers: FamilyMember[]
  acceptInstructions: boolean
  acceptTerms: boolean
}

const initialState: FormState = {
  fullName: '',
  gender: 'Male',
  dob: '',
  age: '',
  lifeStatus: 'Single',
  currentStatus: 'Working',
  occupation: '',
  nonCatholic: false,
  phone: '',
  whatsappSame: true,
  whatsapp: '',
  altPhone: '',
  email: '',
  houseName: '',
  place: '',
  district: '',
  state: '',
  country: 'Tanzania',
  diocese: '',
  parish: '',
  familyMembers: [],
  acceptInstructions: false,
  acceptTerms: false,
}

type Errors = Partial<Record<keyof FormState, string>>

const steps = [{ id: 'about' }, { id: 'contact' }, { id: 'companions' }, { id: 'review' }] as const

type StepId = (typeof steps)[number]['id']

const PHONE_PATTERN = /^[0-9+\s-]{7,16}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ageFromDob = (dob: string) => {
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1
  return age >= 0 ? String(age) : ''
}

const validate = (stepId: StepId, form: FormState, t: T): Errors => {
  const errors: Errors = {}
  const required = (field: keyof FormState, message: string = t('retreats.wizard.errors.required')) => {
    if (!String(form[field] ?? '').trim()) errors[field] = message
  }

  if (stepId === 'about') {
    required('fullName', t('retreats.wizard.errors.fullName'))
    required('dob', t('retreats.wizard.errors.dob'))
    required('occupation', t('retreats.wizard.errors.occupation'))
    if (form.dob && !ageFromDob(form.dob)) errors.dob = t('retreats.wizard.errors.dobInvalid')
  }

  if (stepId === 'contact') {
    required('phone', t('retreats.wizard.errors.phone'))
    required('email', t('retreats.wizard.errors.email'))
    required('houseName', t('retreats.wizard.errors.houseName'))
    required('place', t('retreats.wizard.errors.place'))
    if (form.phone && !PHONE_PATTERN.test(form.phone)) errors.phone = t('retreats.wizard.errors.phoneInvalid')
    if (!form.whatsappSame) {
      required('whatsapp', t('retreats.wizard.errors.whatsapp'))
      if (form.whatsapp && !PHONE_PATTERN.test(form.whatsapp)) errors.whatsapp = t('retreats.wizard.errors.whatsappInvalid')
    }
    if (form.altPhone && !PHONE_PATTERN.test(form.altPhone)) errors.altPhone = t('retreats.wizard.errors.phoneInvalid')
    if (form.email && !EMAIL_PATTERN.test(form.email)) errors.email = t('retreats.wizard.errors.emailInvalid')
    if (!form.nonCatholic) {
      required('diocese', t('retreats.wizard.errors.diocese'))
      required('parish', t('retreats.wizard.errors.parish'))
    }
  }

  if (stepId === 'companions') {
    if (!form.acceptInstructions) errors.acceptInstructions = t('retreats.wizard.errors.instructions')
  }

  if (stepId === 'review') {
    if (!form.acceptTerms) errors.acceptTerms = t('retreats.wizard.errors.terms')
  }

  return errors
}

const formatContribution = (retreat: RetreatType, t: T, locale: Locale) =>
  retreat.isPaid === false || !retreat.price ? t('common.labels.freeWillOffering') : formatMoney(retreat.price, locale)

type Confirmation = { id: string; fullName: string; email: string; phone: string; status: string; paymentStatus?: string; ticketCode: string }

/* ----------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */

export default function BookingWizard({ retreat, ended = false }: { retreat: RetreatType; ended?: boolean }) {
  const t = useT()
  const locale = useLocale()
  const option = (value: string) => t.dynamic(`retreats.wizard.options.${value}`, undefined, value)
  const [form, setForm] = useState<FormState>(initialState)
  const [stepIndex, setStepIndex] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [termsOpen, setTermsOpen] = useState(false)
  const [website, setWebsite] = useState('')
  const topRef = useRef<HTMLDivElement>(null)

  const step = steps[stepIndex]
  const closed = retreat.status === 'Closed' || ended
  const genderSeats = form.gender === 'Female' ? retreat.availability.female : form.gender === 'Male' ? retreat.availability.male : null

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'dob') next.age = ageFromDob(String(value))
      if (field === 'nonCatholic' && value) {
        next.diocese = ''
        next.parish = ''
      }
      return next
    })
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const goTo = (index: number) => {
    setStepIndex(index)
    setErrors({})
    scrollToTop()
  }

  const next = () => {
    const stepErrors = validate(step.id, form, t)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length) {
      const first = Object.keys(stepErrors)[0]
      document.getElementById(`field-${first}`)?.focus()
      return
    }
    goTo(Math.min(stepIndex + 1, steps.length - 1))
  }

  const submit = async () => {
    const stepErrors = validate('review', form, t)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const payloadForm = {
        ...form,
        whatsapp: form.whatsappSame ? form.phone : form.whatsapp,
        familyMembers: form.familyMembers.filter((member) => member.name.trim()),
        // Lets the office reply in the guest's language.
        preferredLanguage: locale,
      }
      const response = await fetch('/api/retreats/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreatId: retreat.id, retreatTitle: retreat.title, form: payloadForm, website }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : t('retreats.wizard.errors.submit')
        throw new Error(message)
      }
      const booking = payload.data
      setConfirmation({
        id: booking.id,
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        ticketCode: payload.ticketCode ?? booking.ticketCode,
      })
      scrollToTop()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('retreats.wizard.errors.submit'))
    } finally {
      setSubmitting(false)
    }
  }

  const summary = useMemo(
    () => [
      {
        step: 0,
        title: t('retreats.wizard.steps.about.title'),
        rows: [
          [t('retreats.wizard.review.name'), form.fullName],
          [t('retreats.wizard.review.gender'), option(form.gender)],
          [
            t('retreats.wizard.review.dob'),
            form.dob ? t('retreats.wizard.review.dobValue', { date: formatDate(form.dob, locale), age: form.age }) : '',
          ],
          [t('retreats.wizard.review.lifeStatus'), option(form.lifeStatus)],
          [t('retreats.wizard.review.occupation'), `${form.occupation}${form.currentStatus !== 'N/A' ? ` · ${option(form.currentStatus)}` : ''}`],
        ],
      },
      {
        step: 1,
        title: t('retreats.wizard.steps.contact.title'),
        rows: [
          [t('retreats.wizard.review.phone'), form.phone],
          [t('retreats.wizard.review.whatsapp'), form.whatsappSame ? form.phone : form.whatsapp],
          [t('retreats.wizard.review.email'), form.email],
          [t('retreats.wizard.review.address'), [form.houseName, form.place, form.district, form.state, form.country].filter(Boolean).join(', ')],
          [
            t('retreats.wizard.review.parish'),
            form.nonCatholic ? t('retreats.wizard.review.notCatholic') : [form.parish, form.diocese].filter(Boolean).join(', '),
          ],
        ],
      },
      {
        step: 2,
        title: t('retreats.wizard.steps.companions.title'),
        rows: form.familyMembers.filter((m) => m.name.trim()).length
          ? form.familyMembers
              .filter((m) => m.name.trim())
              .map((m) => [m.name, [m.relationship, m.age && t('retreats.wizard.review.ageValue', { age: m.age })].filter(Boolean).join(', ')])
          : [[t('retreats.wizard.review.joining'), t('retreats.wizard.review.justMe')]],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, t, locale],
  )

  /* ---------------------------- Confirmation ---------------------------- */

  if (confirmation) {
    const ticketUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/retreats/check-booking?code=${encodeURIComponent(confirmation.ticketCode)}`
        : undefined
    const paymentPending = confirmation.paymentStatus === 'pending'
    return (
      <div ref={topRef} id='booking' className='scroll-mt-28 space-y-8'>
        <div className='rounded-[2rem] border border-emerald-200 bg-emerald-50 p-8 text-center'>
          <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600 shadow-soft'>
            <CheckCircle2 className='h-8 w-8' />
          </span>
          <h3 className='mt-5 font-display text-4xl font-semibold text-navy-900'>{t('retreats.wizard.done.title')}</h3>
          <p className='mx-auto mt-3 max-w-lg text-navy-700'>
            {t('retreats.wizard.done.text', {
              name: confirmation.fullName.split(' ')[0],
              email: confirmation.email,
              code: confirmation.ticketCode,
            })}
          </p>
        </div>

        <ol className='grid gap-4 sm:grid-cols-3'>
          {[
            { title: t('retreats.wizard.done.received.title'), text: t('retreats.wizard.done.received.text'), done: true },
            paymentPending
              ? { title: t('retreats.wizard.done.pay.title'), text: t('retreats.wizard.done.pay.text'), done: false }
              : { title: t('retreats.wizard.done.free.title'), text: t('retreats.wizard.done.free.text'), done: true },
            { title: t('retreats.wizard.done.checkIn.title'), text: t('retreats.wizard.done.checkIn.text'), done: false },
          ].map((item, i) => (
            <li key={item.title} className='rounded-2xl border border-border bg-white p-5'>
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                  item.done ? 'bg-emerald-600 text-white' : 'bg-parchment text-navy-800',
                )}
              >
                {item.done ? <Check className='h-4 w-4' /> : i + 1}
              </span>
              <p className='mt-3 font-semibold text-navy-900'>{item.title}</p>
              <p className='mt-1 text-sm text-muted-foreground'>{item.text}</p>
            </li>
          ))}
        </ol>

        <RetreatTicket
          booking={{ ...confirmation }}
          retreat={{
            title: retreat.title,
            dateRange: localizeDateRange(retreat.dateRange, locale),
            timeRange: retreat.timeRange,
            location: retreat.location,
          }}
          ticketUrl={ticketUrl}
        />

        <div className='flex flex-wrap justify-center gap-3'>
          {paymentPending && (
            <Button asChild variant='gold' size='pill'>
              <Link href={`/retreats/${retreat.slug}/payment?booking=${confirmation.id}`}>{t('retreats.wizard.done.payNow')}</Link>
            </Button>
          )}
          <Button asChild variant='outline' size='pill'>
            <Link href={`/retreats/check-booking?code=${encodeURIComponent(confirmation.ticketCode)}`}>{t('retreats.wizard.done.manage')}</Link>
          </Button>
          <Button asChild variant={paymentPending ? 'ghost' : 'default'} size='pill'>
            <Link href='/retreats'>{t('retreats.wizard.done.browse')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  /* ------------------------------- Wizard ------------------------------- */

  const fieldProps = (field: keyof FormState) => ({
    id: `field-${field}`,
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `field-${field}-error` : undefined,
  })

  return (
    <div ref={topRef} id='booking' className='scroll-mt-28'>
      <div className='overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft'>
        {/* Progress */}
        <div className='border-b border-border bg-parchment/60 px-6 py-5 sm:px-8'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.2em] text-gold-700'>
                {t('retreats.wizard.stepOf', { current: stepIndex + 1, total: steps.length })}
              </p>
              <h3 className='mt-1 font-display text-3xl font-semibold text-navy-900'>{t(`retreats.wizard.steps.${step.id}.title`)}</h3>
            </div>
            <p className='hidden text-right text-sm text-muted-foreground sm:block'>{t('retreats.wizard.duration')}</p>
          </div>
          <ol className='mt-5 grid grid-cols-4 gap-2' aria-label={t('retreats.wizard.progress')}>
            {steps.map((item, i) => (
              <li key={item.id}>
                <button
                  type='button'
                  disabled={i > stepIndex}
                  onClick={() => goTo(i)}
                  className='group w-full text-left disabled:cursor-default'
                  aria-current={i === stepIndex ? 'step' : undefined}
                >
                  <span
                    className={cn(
                      'block h-1.5 rounded-full transition-colors',
                      i < stepIndex ? 'bg-navy-900' : i === stepIndex ? 'bg-gold-400' : 'bg-navy-100',
                    )}
                  />
                  <span
                    className={cn(
                      'mt-2 block text-xs font-medium',
                      i <= stepIndex ? 'text-navy-900 group-enabled:group-hover:underline' : 'text-muted-foreground',
                    )}
                  >
                    {t(`retreats.wizard.steps.${item.id}.short`)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className='px-6 py-8 sm:px-8'>
          {closed ? (
            <div className='rounded-2xl bg-parchment p-6 text-center'>
              <p className='font-display text-2xl text-navy-900'>{ended ? t('retreats.wizard.closedEnded') : t('retreats.wizard.closedFull')}</p>
              <p className='mt-2 text-muted-foreground'>{t('retreats.wizard.closedHint')}</p>
              <Button asChild className='mt-5' size='pill'>
                <Link href='/retreats'>{t('retreats.wizard.seeUpcoming')}</Link>
              </Button>
            </div>
          ) : (
            <AnimatePresence mode='wait'>
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                {step.id === 'about' && (
                  <div className='grid gap-6 sm:grid-cols-2'>
                    <Field label={t('retreats.wizard.fields.fullName')} htmlFor='field-fullName' required error={errors.fullName} className='sm:col-span-2'>
                      <input
                        {...fieldProps('fullName')}
                        autoComplete='name'
                        className={inputClass}
                        value={form.fullName}
                        onChange={(e) => update('fullName', e.target.value)}
                        placeholder={t('retreats.wizard.fields.fullNamePlaceholder')}
                      />
                    </Field>
                    <Field label={t('retreats.wizard.fields.gender')} required className='sm:col-span-2'>
                      <Choice name='gender' value={form.gender} options={['Male', 'Female']} onChange={(v) => update('gender', v)} labelFor={option} />
                      {genderSeats !== null && (
                        <p className={cn('text-xs', genderSeats > 0 ? 'text-muted-foreground' : 'text-amber-700')}>
                          {form.gender === 'Female'
                            ? genderSeats > 0
                              ? t('retreats.wizard.fields.femaleSeats', { count: genderSeats })
                              : t('retreats.wizard.fields.femaleFull')
                            : genderSeats > 0
                              ? t('retreats.wizard.fields.maleSeats', { count: genderSeats })
                              : t('retreats.wizard.fields.maleFull')}
                        </p>
                      )}
                    </Field>
                    <Field
                      label={t('retreats.wizard.fields.dob')}
                      htmlFor='field-dob'
                      required
                      error={errors.dob}
                      hint={form.age ? t('retreats.wizard.fields.age', { age: form.age }) : undefined}
                    >
                      <input
                        {...fieldProps('dob')}
                        type='date'
                        autoComplete='bday'
                        max={new Date().toISOString().slice(0, 10)}
                        className={inputClass}
                        value={form.dob}
                        onChange={(e) => update('dob', e.target.value)}
                      />
                    </Field>
                    <Field label={t('retreats.wizard.fields.occupation')} htmlFor='field-occupation' required error={errors.occupation}>
                      <input
                        {...fieldProps('occupation')}
                        autoComplete='organization-title'
                        className={inputClass}
                        value={form.occupation}
                        onChange={(e) => update('occupation', e.target.value)}
                        placeholder={t('retreats.wizard.fields.occupationPlaceholder')}
                      />
                    </Field>
                    <Field label={t('retreats.wizard.fields.lifeStatus')}>
                      <Choice
                        name='lifeStatus'
                        value={form.lifeStatus}
                        options={['Single', 'Married', 'Religious', 'Widowed']}
                        onChange={(v) => update('lifeStatus', v)}
                        labelFor={option}
                      />
                    </Field>
                    <Field label={t('retreats.wizard.fields.currently')}>
                      <Choice
                        name='currentStatus'
                        value={form.currentStatus}
                        options={['Working', 'Studying', 'N/A']}
                        onChange={(v) => update('currentStatus', v)}
                        labelFor={option}
                      />
                    </Field>
                    <div className='sm:col-span-2'>
                      <CheckboxCard checked={form.nonCatholic} onChange={(v) => update('nonCatholic', v)}>
                        {t('retreats.wizard.fields.nonCatholic')}{' '}
                        <span className='text-muted-foreground'>{t('retreats.wizard.fields.welcome')}</span>
                      </CheckboxCard>
                    </div>
                  </div>
                )}

                {step.id === 'contact' && (
                  <div className='space-y-8'>
                    <Honeypot value={website} onChange={setWebsite} />
                    <div className='grid gap-6 sm:grid-cols-2'>
                      <Field label={t('retreats.wizard.fields.phone')} htmlFor='field-phone' required error={errors.phone}>
                        <input
                          {...fieldProps('phone')}
                          type='tel'
                          autoComplete='tel'
                          className={inputClass}
                          value={form.phone}
                          onChange={(e) => update('phone', e.target.value)}
                          placeholder='+255 7XX XXX XXX'
                        />
                      </Field>
                      <Field
                        label={t('retreats.wizard.fields.email')}
                        htmlFor='field-email'
                        required
                        error={errors.email}
                        hint={t('retreats.wizard.fields.emailHint')}
                      >
                        <input
                          {...fieldProps('email')}
                          type='email'
                          autoComplete='email'
                          className={inputClass}
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          placeholder='you@example.com'
                        />
                      </Field>
                      <div className='space-y-3 sm:col-span-2'>
                        <CheckboxCard checked={form.whatsappSame} onChange={(v) => update('whatsappSame', v)}>
                          {t('retreats.wizard.fields.whatsappSame')}
                        </CheckboxCard>
                        {!form.whatsappSame && (
                          <Field label={t('retreats.wizard.fields.whatsapp')} htmlFor='field-whatsapp' required error={errors.whatsapp}>
                            <input
                              {...fieldProps('whatsapp')}
                              type='tel'
                              className={inputClass}
                              value={form.whatsapp}
                              onChange={(e) => update('whatsapp', e.target.value)}
                            />
                          </Field>
                        )}
                      </div>
                      <Field
                        label={t('retreats.wizard.fields.altPhone')}
                        htmlFor='field-altPhone'
                        error={errors.altPhone}
                        hint={t('retreats.wizard.fields.altPhoneHint')}
                      >
                        <input
                          {...fieldProps('altPhone')}
                          type='tel'
                          className={inputClass}
                          value={form.altPhone}
                          onChange={(e) => update('altPhone', e.target.value)}
                        />
                      </Field>
                    </div>

                    <fieldset className='grid gap-6 border-t border-border pt-8 sm:grid-cols-2'>
                      <legend className='mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>{t('retreats.wizard.fields.address')}</legend>
                      <Field label={t('retreats.wizard.fields.houseName')} htmlFor='field-houseName' required error={errors.houseName}>
                        <input
                          {...fieldProps('houseName')}
                          autoComplete='address-line1'
                          className={inputClass}
                          value={form.houseName}
                          onChange={(e) => update('houseName', e.target.value)}
                        />
                      </Field>
                      <Field label={t('retreats.wizard.fields.place')} htmlFor='field-place' required error={errors.place}>
                        <input
                          {...fieldProps('place')}
                          autoComplete='address-level2'
                          className={inputClass}
                          value={form.place}
                          onChange={(e) => update('place', e.target.value)}
                        />
                      </Field>
                      <Field label={t('retreats.wizard.fields.district')} htmlFor='field-district'>
                        <input id='field-district' className={inputClass} value={form.district} onChange={(e) => update('district', e.target.value)} />
                      </Field>
                      <Field label={t('retreats.wizard.fields.region')} htmlFor='field-state'>
                        <input
                          id='field-state'
                          autoComplete='address-level1'
                          className={inputClass}
                          value={form.state}
                          onChange={(e) => update('state', e.target.value)}
                        />
                      </Field>
                      <Field label={t('retreats.wizard.fields.country')} htmlFor='field-country'>
                        <input
                          id='field-country'
                          autoComplete='country-name'
                          className={inputClass}
                          value={form.country}
                          onChange={(e) => update('country', e.target.value)}
                        />
                      </Field>
                    </fieldset>

                    {!form.nonCatholic && (
                      <fieldset className='grid gap-6 border-t border-border pt-8 sm:grid-cols-2'>
                        <legend className='mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>{t('retreats.wizard.fields.parishGroup')}</legend>
                        <Field label={t('retreats.wizard.fields.diocese')} htmlFor='field-diocese' required error={errors.diocese}>
                          <input
                            {...fieldProps('diocese')}
                            className={inputClass}
                            value={form.diocese}
                            onChange={(e) => update('diocese', e.target.value)}
                            placeholder={t('retreats.wizard.fields.diocesePlaceholder')}
                          />
                        </Field>
                        <Field label={t('retreats.wizard.fields.parish')} htmlFor='field-parish' required error={errors.parish}>
                          <input {...fieldProps('parish')} className={inputClass} value={form.parish} onChange={(e) => update('parish', e.target.value)} />
                        </Field>
                      </fieldset>
                    )}
                  </div>
                )}

                {step.id === 'companions' && (
                  <div className='space-y-6'>
                    <p className='text-muted-foreground'>{t('retreats.wizard.family.intro')}</p>
                    <div className='space-y-3'>
                      {form.familyMembers.map((member, index) => (
                        <div key={index} className='grid gap-3 rounded-2xl border border-border bg-ivory p-4 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end'>
                          <Field label={t('retreats.wizard.family.name')} htmlFor={`member-name-${index}`}>
                            <input
                              id={`member-name-${index}`}
                              className={inputClass}
                              value={member.name}
                              onChange={(e) => {
                                const members = [...form.familyMembers]
                                members[index] = { ...member, name: e.target.value }
                                update('familyMembers', members)
                              }}
                            />
                          </Field>
                          <Field label={t('retreats.wizard.family.relationship')} htmlFor={`member-rel-${index}`}>
                            <input
                              id={`member-rel-${index}`}
                              className={inputClass}
                              value={member.relationship}
                              placeholder={t('retreats.wizard.family.relationshipPlaceholder')}
                              onChange={(e) => {
                                const members = [...form.familyMembers]
                                members[index] = { ...member, relationship: e.target.value }
                                update('familyMembers', members)
                              }}
                            />
                          </Field>
                          <Field label={t('retreats.wizard.family.age')} htmlFor={`member-age-${index}`}>
                            <input
                              id={`member-age-${index}`}
                              inputMode='numeric'
                              className={inputClass}
                              value={member.age}
                              onChange={(e) => {
                                const members = [...form.familyMembers]
                                members[index] = { ...member, age: e.target.value.replace(/[^0-9]/g, '').slice(0, 3) }
                                update('familyMembers', members)
                              }}
                            />
                          </Field>
                          <button
                            type='button'
                            onClick={() => update('familyMembers', form.familyMembers.filter((_, i) => i !== index))}
                            className='flex h-[50px] items-center justify-center rounded-xl px-3 text-muted-foreground hover:bg-red-50 hover:text-red-600'
                            aria-label={t('retreats.wizard.family.remove', { number: index + 1 })}
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='pill'
                      onClick={() => update('familyMembers', [...form.familyMembers, { name: '', relationship: '', age: '' }])}
                    >
                      <Plus className='mr-1.5 h-4 w-4' /> {t('retreats.wizard.family.add')}
                    </Button>

                    <div className='rounded-2xl bg-parchment p-5 text-sm leading-relaxed text-navy-800'>
                      <p className='font-semibold text-navy-900'>{t('retreats.wizard.family.beforeTitle')}</p>
                      <ul className='mt-2 list-disc space-y-1 pl-5'>
                        <li>{t('retreats.wizard.family.before1')}</li>
                        <li>{t('retreats.wizard.family.before2')}</li>
                        <li>{t('retreats.wizard.family.before3')}</li>
                        <li>{t('retreats.wizard.family.before4')}</li>
                      </ul>
                    </div>
                    <CheckboxCard
                      id='field-acceptInstructions'
                      checked={form.acceptInstructions}
                      onChange={(v) => update('acceptInstructions', v)}
                      error={errors.acceptInstructions}
                    >
                      {t('retreats.wizard.family.accept')}
                    </CheckboxCard>
                  </div>
                )}

                {step.id === 'review' && (
                  <div className='space-y-6'>
                    {summary.map((section) => (
                      <div key={section.title} className='rounded-2xl border border-border'>
                        <header className='flex items-center justify-between border-b border-border px-5 py-3'>
                          <h4 className='font-semibold text-navy-900'>{section.title}</h4>
                          <button
                            type='button'
                            onClick={() => goTo(section.step)}
                            className='inline-flex items-center gap-1 text-sm font-medium text-gold-700 hover:underline'
                          >
                            <Pencil className='h-3.5 w-3.5' /> {t('retreats.wizard.review.edit')}
                          </button>
                        </header>
                        <dl className='divide-y divide-border'>
                          {section.rows.map(([label, value]) => (
                            <div key={label} className='grid grid-cols-3 gap-4 px-5 py-2.5 text-sm'>
                              <dt className='text-muted-foreground'>{label}</dt>
                              <dd className='col-span-2 text-navy-900'>{value || '—'}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}

                    <div className='rounded-2xl border border-border'>
                      <button
                        type='button'
                        onClick={() => setTermsOpen((v) => !v)}
                        className='flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-navy-900'
                        aria-expanded={termsOpen}
                      >
                        {t('retreats.wizard.review.terms')}
                        <ChevronDown className={cn('h-4 w-4 transition-transform', termsOpen && 'rotate-180')} />
                      </button>
                      {termsOpen && (
                        <dl className='space-y-4 border-t border-border px-5 py-4 text-sm'>
                          {retreatTerms.map((term) => (
                            <div key={term}>
                              <dt className='font-medium text-navy-900'>{t(`retreats.terms.${term}.title`)}</dt>
                              <dd className='mt-0.5 leading-relaxed text-muted-foreground'>{t(`retreats.terms.${term}.body`)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                    <CheckboxCard id='field-acceptTerms' checked={form.acceptTerms} onChange={(v) => update('acceptTerms', v)} error={errors.acceptTerms}>
                      {t('retreats.wizard.review.acceptTerms')}
                    </CheckboxCard>

                    {retreat.isPaid !== false && retreat.price ? (
                      <p className='rounded-2xl bg-gold-50 px-5 py-4 text-sm text-gold-800'>
                        {t('retreats.wizard.review.contribution', { amount: formatContribution(retreat, t, locale) })}
                      </p>
                    ) : null}

                    {submitError && (
                      <p role='alert' className='rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700'>
                        {submitError}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {!closed && (
          <div className='flex items-center justify-between gap-3 border-t border-border bg-ivory px-6 py-5 sm:px-8'>
            <Button type='button' variant='ghost' onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0 || submitting}>
              <ArrowLeft className='mr-1.5 h-4 w-4' /> {t('common.actions.back')}
            </Button>
            {step.id === 'review' ? (
              <Button type='button' size='xl' onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Check className='mr-2 h-4 w-4' />}
                {t('retreats.wizard.confirm')}
              </Button>
            ) : (
              <Button type='button' size='xl' onClick={next}>
                {t('common.actions.continue')} <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Sticky retreat summary shown next to the wizard
 * ------------------------------------------------------------------------- */

export function RetreatFactsCard({ retreat, ended = false }: { retreat: RetreatType; ended?: boolean }) {
  const t = useT()
  const locale = useLocale()
  const facts = [
    { icon: CalendarDays, label: t('retreats.facts.dates'), value: localizeDateRange(retreat.dateRange, locale) },
    { icon: Clock, label: t('retreats.facts.schedule'), value: retreat.timeRange },
    { icon: MapPin, label: t('retreats.facts.location'), value: retreat.location },
    {
      icon: Users,
      label: t('retreats.facts.places'),
      value: t('retreats.facts.placesValue', { men: retreat.availability.male, women: retreat.availability.female }),
    },
  ]
  return (
    <div className='rounded-[2rem] border border-border bg-white p-6 shadow-soft'>
      <p className='text-xs uppercase tracking-wider text-muted-foreground'>{t('retreats.facts.perPerson')}</p>
      <p className='mt-1 font-display text-4xl font-semibold text-navy-900'>{formatContribution(retreat, t, locale)}</p>
      <dl className='mt-6 space-y-4'>
        {facts.map((fact) => (
          <div key={fact.label} className='flex gap-3'>
            <fact.icon className='mt-0.5 h-5 w-5 shrink-0 text-gold-500' />
            <div>
              <dt className='text-xs uppercase tracking-wider text-muted-foreground'>{fact.label}</dt>
              <dd className='text-[15px] text-navy-900'>{fact.value}</dd>
            </div>
          </div>
        ))}
      </dl>
      {retreat.status !== 'Closed' && !ended && (
        <Button asChild size='xl' className='mt-6 w-full'>
          <a href='#booking'>{t('retreats.facts.reserve')}</a>
        </Button>
      )}
      <p className='mt-4 text-center text-xs text-muted-foreground'>
        {t('retreats.facts.questions')} <a href='tel:+255765572679' className='font-medium text-navy-800'>+255 765 572 679</a>
      </p>
    </div>
  )
}
