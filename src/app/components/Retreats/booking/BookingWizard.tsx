'use client'

import Link from 'next/link'
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

const steps = [
  { id: 'about', title: 'About you', short: 'You' },
  { id: 'contact', title: 'Contact & parish', short: 'Contact' },
  { id: 'companions', title: 'Family members', short: 'Family' },
  { id: 'review', title: 'Review & confirm', short: 'Confirm' },
] as const

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

const validate = (stepId: StepId, form: FormState): Errors => {
  const errors: Errors = {}
  const required = (field: keyof FormState, message = 'This field is required.') => {
    if (!String(form[field] ?? '').trim()) errors[field] = message
  }

  if (stepId === 'about') {
    required('fullName', 'Please enter your full name.')
    required('dob', 'Please enter your date of birth.')
    required('occupation', 'Please tell us your occupation.')
    if (form.dob && !ageFromDob(form.dob)) errors.dob = 'Please enter a valid date of birth.'
  }

  if (stepId === 'contact') {
    required('phone', 'Please enter a phone number.')
    required('email', 'Please enter your email address.')
    required('houseName', 'Please enter your house or street.')
    required('place', 'Please enter your town or village.')
    if (form.phone && !PHONE_PATTERN.test(form.phone)) errors.phone = 'Please enter a valid phone number.'
    if (!form.whatsappSame) {
      required('whatsapp', 'Please enter your WhatsApp number.')
      if (form.whatsapp && !PHONE_PATTERN.test(form.whatsapp)) errors.whatsapp = 'Please enter a valid WhatsApp number.'
    }
    if (form.altPhone && !PHONE_PATTERN.test(form.altPhone)) errors.altPhone = 'Please enter a valid phone number.'
    if (form.email && !EMAIL_PATTERN.test(form.email)) errors.email = 'Please enter a valid email address.'
    if (!form.nonCatholic) {
      required('diocese', 'Please enter your diocese.')
      required('parish', 'Please enter your parish.')
    }
  }

  if (stepId === 'companions') {
    if (!form.acceptInstructions) errors.acceptInstructions = 'Please confirm you have read the instructions.'
  }

  if (stepId === 'review') {
    if (!form.acceptTerms) errors.acceptTerms = 'Please accept the retreat terms to complete your booking.'
  }

  return errors
}

const formatContribution = (retreat: RetreatType) =>
  retreat.isPaid === false || !retreat.price ? 'Free-will offering' : `TZS ${retreat.price.toLocaleString('en-US')}`

type Confirmation = { id: string; fullName: string; email: string; phone: string; status: string; paymentStatus?: string; ticketCode: string }

/* ----------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */

export default function BookingWizard({ retreat, ended = false }: { retreat: RetreatType; ended?: boolean }) {
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
    const stepErrors = validate(step.id, form)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length) {
      const first = Object.keys(stepErrors)[0]
      document.getElementById(`field-${first}`)?.focus()
      return
    }
    goTo(Math.min(stepIndex + 1, steps.length - 1))
  }

  const submit = async () => {
    const stepErrors = validate('review', form)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const payloadForm = {
        ...form,
        whatsapp: form.whatsappSame ? form.phone : form.whatsapp,
        familyMembers: form.familyMembers.filter((member) => member.name.trim()),
      }
      const response = await fetch('/api/retreats/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retreatId: retreat.id, retreatTitle: retreat.title, form: payloadForm, website }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'We could not complete your booking. Please try again.'
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
      setSubmitError(error instanceof Error ? error.message : 'We could not complete your booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const summary = useMemo(
    () => [
      {
        step: 0,
        title: 'About you',
        rows: [
          ['Name', form.fullName],
          ['Gender', form.gender],
          ['Date of birth', form.dob ? `${new Date(form.dob).toLocaleDateString('en-GB')} (age ${form.age})` : ''],
          ['Life status', form.lifeStatus],
          ['Occupation', `${form.occupation}${form.currentStatus !== 'N/A' ? ` · ${form.currentStatus}` : ''}`],
        ],
      },
      {
        step: 1,
        title: 'Contact & parish',
        rows: [
          ['Phone', form.phone],
          ['WhatsApp', form.whatsappSame ? form.phone : form.whatsapp],
          ['Email', form.email],
          ['Address', [form.houseName, form.place, form.district, form.state, form.country].filter(Boolean).join(', ')],
          ['Parish', form.nonCatholic ? 'Not Catholic' : [form.parish, form.diocese].filter(Boolean).join(', ')],
        ],
      },
      {
        step: 2,
        title: 'Family members',
        rows: form.familyMembers.filter((m) => m.name.trim()).length
          ? form.familyMembers
              .filter((m) => m.name.trim())
              .map((m) => [m.name, [m.relationship, m.age && `age ${m.age}`].filter(Boolean).join(', ')])
          : [['Joining', 'Just me']],
      },
    ],
    [form],
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
          <h3 className='mt-5 font-display text-4xl font-semibold text-navy-900'>Your place is reserved</h3>
          <p className='mx-auto mt-3 max-w-lg text-navy-700'>
            Thank you, {confirmation.fullName.split(' ')[0]}. We have emailed your ticket to <strong>{confirmation.email}</strong>. Your
            ticket code is <span className='font-mono font-semibold'>{confirmation.ticketCode}</span>.
          </p>
        </div>

        <ol className='grid gap-4 sm:grid-cols-3'>
          {[
            { title: 'Booking received', text: 'Our team reviews and approves every registration.', done: true },
            paymentPending
              ? { title: 'Pay your contribution', text: 'Pay now online or later from Manage booking.', done: false }
              : { title: 'No payment needed', text: 'This retreat is offered freely.', done: true },
            { title: 'Check in with your QR code', text: 'Show the ticket below on arrival at DMRC.', done: false },
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
          retreat={{ title: retreat.title, dateRange: retreat.dateRange, timeRange: retreat.timeRange, location: retreat.location }}
          ticketUrl={ticketUrl}
        />

        <div className='flex flex-wrap justify-center gap-3'>
          {paymentPending && (
            <Button asChild variant='gold' size='pill'>
              <Link href={`/retreats/${retreat.slug}/payment?booking=${confirmation.id}`}>Pay contribution now</Link>
            </Button>
          )}
          <Button asChild variant='outline' size='pill'>
            <Link href={`/retreats/check-booking?code=${encodeURIComponent(confirmation.ticketCode)}`}>Manage this booking</Link>
          </Button>
          <Button asChild variant={paymentPending ? 'ghost' : 'default'} size='pill'>
            <Link href='/retreats'>Browse more retreats</Link>
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
                Step {stepIndex + 1} of {steps.length}
              </p>
              <h3 className='mt-1 font-display text-3xl font-semibold text-navy-900'>{step.title}</h3>
            </div>
            <p className='hidden text-right text-sm text-muted-foreground sm:block'>Takes about 3 minutes</p>
          </div>
          <ol className='mt-5 grid grid-cols-4 gap-2' aria-label='Booking progress'>
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
                    {item.short}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className='px-6 py-8 sm:px-8'>
          {closed ? (
            <div className='rounded-2xl bg-parchment p-6 text-center'>
              <p className='font-display text-2xl text-navy-900'>{ended ? 'This retreat has already taken place.' : 'Registration for this retreat is closed.'}</p>
              <p className='mt-2 text-muted-foreground'>Please choose another date from our upcoming retreats.</p>
              <Button asChild className='mt-5' size='pill'>
                <Link href='/retreats'>See upcoming retreats</Link>
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
                    <Field label='Full name' htmlFor='field-fullName' required error={errors.fullName} className='sm:col-span-2'>
                      <input
                        {...fieldProps('fullName')}
                        autoComplete='name'
                        className={inputClass}
                        value={form.fullName}
                        onChange={(e) => update('fullName', e.target.value)}
                        placeholder='As it should appear on your ticket'
                      />
                    </Field>
                    <Field label='Gender' required className='sm:col-span-2'>
                      <Choice name='gender' value={form.gender} options={['Male', 'Female']} onChange={(v) => update('gender', v)} />
                      {genderSeats !== null && (
                        <p className={cn('text-xs', genderSeats > 0 ? 'text-muted-foreground' : 'text-amber-700')}>
                          {genderSeats > 0
                            ? `${genderSeats} ${form.gender.toLowerCase()} places currently available`
                            : `${form.gender} places are full — you can still register and we will add you to the waiting list.`}
                        </p>
                      )}
                    </Field>
                    <Field
                      label='Date of birth'
                      htmlFor='field-dob'
                      required
                      error={errors.dob}
                      hint={form.age ? `Age ${form.age}` : undefined}
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
                    <Field label='Occupation' htmlFor='field-occupation' required error={errors.occupation}>
                      <input
                        {...fieldProps('occupation')}
                        autoComplete='organization-title'
                        className={inputClass}
                        value={form.occupation}
                        onChange={(e) => update('occupation', e.target.value)}
                        placeholder='e.g. Teacher'
                      />
                    </Field>
                    <Field label='Life status'>
                      <Choice
                        name='lifeStatus'
                        value={form.lifeStatus}
                        options={['Single', 'Married', 'Religious', 'Widowed']}
                        onChange={(v) => update('lifeStatus', v)}
                      />
                    </Field>
                    <Field label='Currently'>
                      <Choice
                        name='currentStatus'
                        value={form.currentStatus}
                        options={['Working', 'Studying', 'N/A']}
                        onChange={(v) => update('currentStatus', v)}
                      />
                    </Field>
                    <div className='sm:col-span-2'>
                      <CheckboxCard checked={form.nonCatholic} onChange={(v) => update('nonCatholic', v)}>
                        I am not a Catholic. <span className='text-muted-foreground'>Everyone is welcome at DMRC.</span>
                      </CheckboxCard>
                    </div>
                  </div>
                )}

                {step.id === 'contact' && (
                  <div className='space-y-8'>
                    <Honeypot value={website} onChange={setWebsite} />
                    <div className='grid gap-6 sm:grid-cols-2'>
                      <Field label='Phone number' htmlFor='field-phone' required error={errors.phone}>
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
                      <Field label='Email address' htmlFor='field-email' required error={errors.email} hint='Your ticket is sent here.'>
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
                          My WhatsApp number is the same as my phone number
                        </CheckboxCard>
                        {!form.whatsappSame && (
                          <Field label='WhatsApp number' htmlFor='field-whatsapp' required error={errors.whatsapp}>
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
                      <Field label='Alternative phone' htmlFor='field-altPhone' error={errors.altPhone} hint='Optional — someone we can reach in an emergency.'>
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
                      <legend className='mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>Address</legend>
                      <Field label='House / street' htmlFor='field-houseName' required error={errors.houseName}>
                        <input
                          {...fieldProps('houseName')}
                          autoComplete='address-line1'
                          className={inputClass}
                          value={form.houseName}
                          onChange={(e) => update('houseName', e.target.value)}
                        />
                      </Field>
                      <Field label='Town / village' htmlFor='field-place' required error={errors.place}>
                        <input
                          {...fieldProps('place')}
                          autoComplete='address-level2'
                          className={inputClass}
                          value={form.place}
                          onChange={(e) => update('place', e.target.value)}
                        />
                      </Field>
                      <Field label='District' htmlFor='field-district'>
                        <input id='field-district' className={inputClass} value={form.district} onChange={(e) => update('district', e.target.value)} />
                      </Field>
                      <Field label='Region' htmlFor='field-state'>
                        <input
                          id='field-state'
                          autoComplete='address-level1'
                          className={inputClass}
                          value={form.state}
                          onChange={(e) => update('state', e.target.value)}
                        />
                      </Field>
                      <Field label='Country' htmlFor='field-country'>
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
                        <legend className='mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>Parish</legend>
                        <Field label='Diocese' htmlFor='field-diocese' required error={errors.diocese}>
                          <input
                            {...fieldProps('diocese')}
                            className={inputClass}
                            value={form.diocese}
                            onChange={(e) => update('diocese', e.target.value)}
                            placeholder='e.g. Archdiocese of Dar es Salaam'
                          />
                        </Field>
                        <Field label='Parish' htmlFor='field-parish' required error={errors.parish}>
                          <input {...fieldProps('parish')} className={inputClass} value={form.parish} onChange={(e) => update('parish', e.target.value)} />
                        </Field>
                      </fieldset>
                    )}
                  </div>
                )}

                {step.id === 'companions' && (
                  <div className='space-y-6'>
                    <p className='text-muted-foreground'>
                      Coming with family? Add family members who live at the same address so we can prepare their places. Others should register
                      separately.
                    </p>
                    <div className='space-y-3'>
                      {form.familyMembers.map((member, index) => (
                        <div key={index} className='grid gap-3 rounded-2xl border border-border bg-ivory p-4 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end'>
                          <Field label='Name' htmlFor={`member-name-${index}`}>
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
                          <Field label='Relationship' htmlFor={`member-rel-${index}`}>
                            <input
                              id={`member-rel-${index}`}
                              className={inputClass}
                              value={member.relationship}
                              placeholder='e.g. Daughter'
                              onChange={(e) => {
                                const members = [...form.familyMembers]
                                members[index] = { ...member, relationship: e.target.value }
                                update('familyMembers', members)
                              }}
                            />
                          </Field>
                          <Field label='Age' htmlFor={`member-age-${index}`}>
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
                            aria-label={`Remove family member ${index + 1}`}
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
                      <Plus className='mr-1.5 h-4 w-4' /> Add a family member
                    </Button>

                    <div className='rounded-2xl bg-parchment p-5 text-sm leading-relaxed text-navy-800'>
                      <p className='font-semibold text-navy-900'>Before you come</p>
                      <ul className='mt-2 list-disc space-y-1 pl-5'>
                        <li>Arrive on time for registration on the first day; late arrivals may not be admitted.</li>
                        <li>Bring your Bible, a notebook, personal toiletries and any medication you need.</li>
                        <li>Mobile phones are kept switched off during sessions to protect the silence of the retreat.</li>
                        <li>Stay for the whole retreat. Leaving early should be agreed with the retreat team.</li>
                      </ul>
                    </div>
                    <CheckboxCard
                      id='field-acceptInstructions'
                      checked={form.acceptInstructions}
                      onChange={(v) => update('acceptInstructions', v)}
                      error={errors.acceptInstructions}
                    >
                      I have read these instructions and will follow them.
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
                            <Pencil className='h-3.5 w-3.5' /> Edit
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
                        Retreat terms & conditions
                        <ChevronDown className={cn('h-4 w-4 transition-transform', termsOpen && 'rotate-180')} />
                      </button>
                      {termsOpen && (
                        <dl className='space-y-4 border-t border-border px-5 py-4 text-sm'>
                          {retreatTerms.map((term) => (
                            <div key={term.title}>
                              <dt className='font-medium text-navy-900'>{term.title}</dt>
                              <dd className='mt-0.5 leading-relaxed text-muted-foreground'>{term.body}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                    <CheckboxCard id='field-acceptTerms' checked={form.acceptTerms} onChange={(v) => update('acceptTerms', v)} error={errors.acceptTerms}>
                      I accept the retreat terms & conditions and consent to DMRC using my details to manage this booking.
                    </CheckboxCard>

                    {retreat.isPaid !== false && retreat.price ? (
                      <p className='rounded-2xl bg-gold-50 px-5 py-4 text-sm text-gold-800'>
                        Your contribution of <strong>{formatContribution(retreat)}</strong> per person is paid after you confirm. You can pay
                        straight away or later from Manage booking.
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
              <ArrowLeft className='mr-1.5 h-4 w-4' /> Back
            </Button>
            {step.id === 'review' ? (
              <Button type='button' size='xl' onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Check className='mr-2 h-4 w-4' />}
                Confirm booking
              </Button>
            ) : (
              <Button type='button' size='xl' onClick={next}>
                Continue <ArrowRight className='ml-2 h-4 w-4' />
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
  const facts = [
    { icon: CalendarDays, label: 'Dates', value: retreat.dateRange },
    { icon: Clock, label: 'Schedule', value: retreat.timeRange },
    { icon: MapPin, label: 'Location', value: retreat.location },
    {
      icon: Users,
      label: 'Places available',
      value: `${retreat.availability.male} men · ${retreat.availability.female} women`,
    },
  ]
  return (
    <div className='rounded-[2rem] border border-border bg-white p-6 shadow-soft'>
      <p className='text-xs uppercase tracking-wider text-muted-foreground'>Contribution per person</p>
      <p className='mt-1 font-display text-4xl font-semibold text-navy-900'>{formatContribution(retreat)}</p>
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
          <a href='#booking'>Reserve your place</a>
        </Button>
      )}
      <p className='mt-4 text-center text-xs text-muted-foreground'>
        Questions? Call <a href='tel:+255765572679' className='font-medium text-navy-800'>+255 765 572 679</a>
      </p>
    </div>
  )
}
