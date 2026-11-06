'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react/dist/iconify.js'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { CheckCircle2, CreditCard, ShieldCheck, Smartphone } from 'lucide-react'

import { RetreatType } from '@/app/types/retreat'
import RetreatTicket from '@/app/components/Retreats/RetreatTicket'

type FormState = {
  acceptTerms: boolean
  fullName: string
  lifeStatus: string
  gender: string
  currentStatus: string
  occupation: string
  dob: string
  age: string
  nonCatholic: boolean
  houseName: string
  place: string
  district: string
  state: string
  country: string
  phone: string
  whatsappSame: boolean
  whatsapp: string
  altPhone: string
  email: string
  diocese: string
  parish: string
  acceptInstructions: boolean
  familyMembers: { name: string; relationship: string; age: string }[]
  paymentMethod: 'card' | 'mobile'
  cardName: string
  cardNumber: string
  cardExpiry: string
  cardCvc: string
  mobileNetwork: string
  mobileNumber: string
}

const initialState: FormState = {
  acceptTerms: false,
  fullName: '',
  lifeStatus: 'Single',
  gender: 'Male',
  currentStatus: 'Working',
  occupation: '',
  dob: '',
  age: '',
  nonCatholic: false,
  houseName: '',
  place: '',
  district: '',
  state: '',
  country: '',
  phone: '',
  whatsappSame: false,
  whatsapp: '',
  altPhone: '',
  email: '',
  diocese: '',
  parish: '',
  acceptInstructions: false,
  familyMembers: [],
  paymentMethod: 'card',
  cardName: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  mobileNetwork: 'Vodacom M-Pesa',
  mobileNumber: '',
}

const steps = [
  {
    id: 'terms',
    title: 'Terms & Conditions',
    icon: 'solar:document-bold-duotone',
  },
  {
    id: 'personal',
    title: 'Personal Information',
    icon: 'solar:user-bold-duotone',
  },
  {
    id: 'address',
    title: 'Address',
    icon: 'solar:map-point-bold-duotone',
  },
  {
    id: 'contact',
    title: 'Contact Information',
    icon: 'solar:mailbox-bold-duotone',
  },
  {
    id: 'parish',
    title: 'Parish Details',
    icon: 'solar:church-bold-duotone',
  },
  {
    id: 'family',
    title: 'Family Members',
    icon: 'solar:users-group-rounded-bold-duotone',
  },
  {
    id: 'payment',
    title: 'Payment & Confirmation',
    icon: 'solar:card-send-bold-duotone',
  },
] as const

type StepId = (typeof steps)[number]['id']

const requiredFieldsByStep: Record<StepId, (keyof FormState)[]> = {
  terms: ['acceptTerms'],
  personal: ['fullName', 'occupation', 'dob', 'age'],
  address: ['houseName', 'place'],
  contact: ['phone', 'whatsapp', 'email'],
  parish: ['diocese', 'parish'],
  family: ['acceptInstructions'],
  payment: [],
}

const mobileNetworks = ['Vodacom M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Halopesa']
const cardLogos = ['Visa', 'Mastercard', 'American Express']
const amountFormatter =
  typeof Intl !== 'undefined'
    ? new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 })
    : null

const calculateAgeFromDob = (dob: string): string => {
  if (!dob) return ''
  const birthDate = new Date(dob)
  if (Number.isNaN(birthDate.getTime())) return ''

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDifference = today.getMonth() - birthDate.getMonth()

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age > 0 ? String(age) : '0'
}

interface RetreatBookingFormProps {
  retreat: RetreatType
}

type BookingConfirmation = {
  booking: {
    id: string
    fullName: string
    email: string
    phone: string
    status: string
  }
  ticketCode: string
  ticketUrl: string
}

const RetreatBookingForm = ({ retreat }: RetreatBookingFormProps) => {
  const [form, setForm] = useState<FormState>(initialState)
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const step = steps[currentStep]
  const amountLabel = useMemo(() => {
    if (retreat.isPaid === false) {
      return 'Sponsored / Free'
    }
    return amountFormatter?.format(retreat.price ?? 0) ?? `${retreat.price ?? 0} TSh`
  }, [retreat.isPaid, retreat.price])

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => {
      const next: FormState = { ...prev, [field]: value }

      if (field === 'dob') {
        next.age = calculateAgeFromDob(String(value))
      }

      if (field === 'nonCatholic' && value === true) {
        next.diocese = ''
        next.parish = ''
      }

      if (field === 'whatsappSame' && typeof value === 'boolean' && value) {
        next.whatsapp = prev.phone
      }

      if (field === 'phone' && prev.whatsappSame) {
        next.whatsapp = String(value)
      }

      return next
    })

    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]

      if (field === 'dob' || field === 'age') {
        delete next.dob
        delete next.age
      }

      if (field === 'nonCatholic') {
        delete next.diocese
        delete next.parish
      }

      if (field === 'phone' || field === 'whatsappSame') {
        delete next.whatsapp
      }

      return next
    })
  }

  const validateStep = (stepId: StepId) => {
    if (stepId === 'payment') {
      if (retreat.isPaid === false) {
        setErrors({})
        return true
      }

      const paymentErrors: Partial<Record<keyof FormState, string>> = {}

      if (form.paymentMethod === 'card') {
        if (!form.cardName.trim()) paymentErrors.cardName = 'Cardholder name is required.'
        if (!/^[0-9\s]{12,19}$/.test(form.cardNumber.replace(/\s+/g, ''))) paymentErrors.cardNumber = 'Enter a valid card number.'
        if (!/^\d{2}\s?\/\s?\d{2}$/.test(form.cardExpiry)) paymentErrors.cardExpiry = 'Enter expiry as MM/YY.'
        if (!/^\d{3,4}$/.test(form.cardCvc)) paymentErrors.cardCvc = 'Enter a valid CVC.'
      } else {
        if (!form.mobileNetwork.trim()) paymentErrors.mobileNetwork = 'Select a mobile network.'
        if (!/^[0-9+\s-]{7,15}$/.test(form.mobileNumber)) paymentErrors.mobileNumber = 'Enter a valid mobile number.'
      }

      setErrors(paymentErrors)
      return Object.keys(paymentErrors).length === 0
    }

    let fields = requiredFieldsByStep[stepId]
    if (stepId === 'parish' && form.nonCatholic) {
      fields = []
    }
    const newErrors: Partial<Record<keyof FormState, string>> = {}

    fields.forEach((field) => {
      if (field === 'acceptTerms') {
        if (!form.acceptTerms) {
          newErrors[field] = 'You must accept the terms and conditions to proceed.'
        }
        return
      }

      if (field === 'acceptInstructions') {
        if (!form.acceptInstructions) {
          newErrors[field] = 'Please agree to the instructions.'
        }
        return
      }

      if (!String(form[field] ?? '').trim()) {
        newErrors[field] = 'This field is required.'
      }
    })

    if (stepId === 'contact') {
      if (form.phone && !/^[0-9+\s-]{7,15}$/.test(form.phone)) {
        newErrors.phone = 'Please enter a valid phone number.'
      }
      if (form.whatsapp && !/^[0-9+\s-]{7,15}$/.test(form.whatsapp)) {
        newErrors.whatsapp = 'Please enter a valid WhatsApp number.'
      }
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = 'Please enter a valid email address.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goToStep = (next: number) => {
    setCurrentStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNext = () => {
    if (!validateStep(step.id)) return
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep === 0) return
    goToStep(currentStep - 1)
  }

  const submitBooking = async () => {
    // Card details are only for the (simulated) payment step and must never be sent or stored.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cardName, cardNumber, cardExpiry, cardCvc, ...safeForm } = form
    const response = await fetch('/api/retreats/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        retreatId: retreat.id,
        retreatTitle: retreat.title,
        form: safeForm,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(payload?.error ?? 'Unable to submit booking.')
    }

    return payload
  }

  const handleConfirmBooking = async () => {
    if (!validateStep('payment')) return
    setIsSubmitting(true)

    try {
      // Simulate a quick payment processing step
      await new Promise((resolve) => setTimeout(resolve, 900))
      const payload = await submitBooking()
      const booking = payload?.data

      if (booking?.id) {
        const ticketCode = payload?.ticketCode ?? booking.ticketCode ?? `DMRC-${booking.id.slice(0, 8).toUpperCase()}`
        const ticketUrl = `${window.location.origin}/retreats/check-booking?code=${encodeURIComponent(ticketCode)}`

        setConfirmation({
          booking: {
            id: booking.id,
            fullName: booking.fullName,
            email: booking.email,
            phone: booking.phone ?? form.phone,
            status: booking.status,
          },
          ticketCode,
          ticketUrl,
        })
      setForm(initialState)
      setCurrentStep(0)
      setErrors({})
        toast.success('Booking confirmed! Your ticket is ready below.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit booking.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewBooking = () => {
    setConfirmation(null)
    setForm(initialState)
    setCurrentStep(0)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const displaySteps = useMemo(
    () =>
      steps.map((item, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep

        return (
          <div
            key={item.id}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 border transition-colors duration-200 ${
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : isCompleted
                ? 'border-primary/40 bg-primary/5 text-primary/60'
                : 'border-gray-200 bg-white text-gray-500'
            }`}>
            <Icon icon={item.icon} className='text-xl' />
            <span className='hidden sm:inline text-sm font-medium'>{item.title}</span>
          </div>
        )
      }),
    [currentStep],
  )

  const renderError = (field: keyof FormState) =>
    errors[field] ? <p className='mt-1 text-sm text-red-500'>{errors[field]}</p> : null

  const addFamilyMember = () => {
    setForm((prev) => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        {
          name: '',
          relationship: '',
          age: '',
        },
      ],
    }))
  }

  const updateFamilyMember = (index: number, key: 'name' | 'relationship' | 'age', value: string) => {
    setForm((prev) => {
      const members = [...prev.familyMembers]
      members[index] = { ...members[index], [key]: value }
      return { ...prev, familyMembers: members }
    })
  }

  const removeFamilyMember = (index: number) => {
    setForm((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index),
    }))
  }

  if (confirmation) {
    return (
      <div id='booking' className='space-y-10'>
        <div className='rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-center shadow-sm'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600 shadow'>
            <CheckCircle2 className='h-8 w-8' />
          </div>
          <h3 className='text-3xl font-bold text-emerald-900'>Booking Confirmed</h3>
          <p className='mt-2 text-sm text-emerald-700'>
            Your ticket code{' '}
            <span className='font-mono font-semibold text-emerald-900'>{confirmation.ticketCode}</span> is ready. Present the QR code at
            check-in for a smooth arrival.
          </p>
        </div>

        <RetreatTicket
          booking={{
            id: confirmation.booking.id,
            fullName: confirmation.booking.fullName,
            email: confirmation.booking.email,
            phone: confirmation.booking.phone,
            ticketCode: confirmation.ticketCode,
            status: confirmation.booking.status,
          }}
          retreat={{
            title: retreat.title,
            dateRange: retreat.dateRange,
            timeRange: retreat.timeRange,
            location: retreat.location,
          }}
          ticketUrl={confirmation.ticketUrl}
        />

        <div className='flex flex-wrap items-center justify-center gap-3'>
          <Link
            href='/retreats/check-booking'
            className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary'>
            <Icon icon='solar:qr-code-bold-duotone' className='text-lg' />
            Check booking status
          </Link>
          <button
            type='button'
            onClick={handleNewBooking}
            className='inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90'>
            Book another retreat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div id='booking' className='space-y-10'>
      <div className='flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5'>
        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-wide text-primary'>Step {currentStep + 1} / {steps.length}</p>
            <h3 className='text-2xl font-bold text-gray-900'>{step.title}</h3>
          </div>
          <div className='flex flex-wrap gap-2'>{displaySteps}</div>
        </div>

        <div className='pt-6 border-t border-gray-100'>
          {step.id === 'terms' && (
            <div className='space-y-6'>
              <div className='rounded-2xl border border-primary/20 bg-primary/5 p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <Icon icon='solar:document-bold-duotone' className='text-3xl text-primary' />
                  <h4 className='text-lg font-bold text-gray-900'>Retreat Terms & Conditions</h4>
                </div>
                
                <div className='max-h-[400px] overflow-y-auto pr-4 space-y-4 text-sm text-gray-700 leading-relaxed'>
                  <p className='font-semibold text-gray-900'>Please read and accept the following terms and conditions before proceeding with your retreat booking:</p>
                  
                  <div className='space-y-3'>
                    <div className='flex gap-3'>
                      <span className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center'>1</span>
                      <div>
                        <p className='font-medium text-gray-900'>Registration & Confirmation</p>
                        <p className='mt-1'>All bookings must be completed online through our official registration system. A confirmation will be sent to your registered email and phone number upon successful registration.</p>
                      </div>
                    </div>
                    
                    <div className='flex gap-3'>
                      <span className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center'>2</span>
                      <div>
                        <p className='font-medium text-gray-900'>Payment Policy</p>
                        <p className='mt-1'>Payment must be completed within the specified timeframe after registration. Failure to complete payment may result in cancellation of your booking. Refunds are subject to our cancellation policy.</p>
                      </div>
                    </div>
                    
                    <div className='flex gap-3'>
                      <span className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center'>3</span>
                      <div>
                        <p className='font-medium text-gray-900'>Cancellation Policy</p>
                        <p className='mt-1'>Cancellations made 7 days before the retreat start date are eligible for a full refund. Cancellations within 7 days may be subject to partial refund or no refund depending on circumstances.</p>
                      </div>
                    </div>
                    
                    <div className='flex gap-3'>
                      <span className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center'>4</span>
                      <div>
                        <p className='font-medium text-gray-900'>Conduct & Discipline</p>
                        <p className='mt-1'>All participants are expected to maintain proper decorum and follow the retreat schedule. Disruptive behavior may result in removal from the retreat without refund.</p>
                      </div>
                    </div>
                    
                    <div className='flex gap-3'>
                      <span className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center'>5</span>
                      <div>
                        <p className='font-medium text-gray-900'>Accommodation & Facilities</p>
                        <p className='mt-1'>Accommodation is provided on a shared basis unless otherwise specified. Participants are responsible for their personal belongings. The retreat center is not liable for any loss or damage.</p>
                      </div>
                    </div>
                    
                    <div className='flex gap-3'>
                      <span className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center'>6</span>
                      <div>
                        <p className='font-medium text-gray-900'>Health & Medical</p>
                        <p className='mt-1'>Participants should inform the organizers of any medical conditions or dietary requirements in advance. Basic first aid is available, but participants are advised to carry necessary personal medications.</p>
                      </div>
                    </div>
                    
                    <div className='flex gap-3'>
                      <span className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center'>7</span>
                      <div>
                        <p className='font-medium text-gray-900'>Photography & Media</p>
                        <p className='mt-1'>Photos and videos may be taken during the retreat for promotional purposes. If you do not wish to be photographed, please inform the organizers upon arrival.</p>
                      </div>
                    </div>
                    
                    <div className='flex gap-3'>
                      <span className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center'>8</span>
                      <div>
                        <p className='font-medium text-gray-900'>Liability</p>
                        <p className='mt-1'>The retreat center and organizers are not liable for any injury, illness, or accident that may occur during the retreat. Participants attend at their own risk.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='rounded-xl border-2 border-primary/30 bg-white px-5 py-4'>
                <label className='flex items-start gap-4 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={form.acceptTerms}
                    onChange={(event) => updateField('acceptTerms', event.target.checked)}
                    className='mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary'
                  />
                  <span className='text-sm font-medium text-gray-700'>
                    I have carefully read and understood all the terms and conditions mentioned above. I agree to abide by these terms during my participation in the retreat.
                  </span>
                </label>
                {renderError('acceptTerms')}
              </div>

              <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
                <div className='flex items-center gap-2'>
                  <Icon icon='solar:info-circle-bold' className='text-lg' />
                  <span className='font-medium'>Important:</span>
                </div>
                <p className='mt-1'>You must accept the terms and conditions to proceed with the booking. Please scroll through and read all terms carefully.</p>
              </div>
            </div>
          )}

          {step.id === 'personal' && (
            <div className='space-y-6'>
              <div className='grid gap-6 sm:grid-cols-2'>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Please enter your name *</label>
                  <input
                    type='text'
                    value={form.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    placeholder='Full Name'
                    className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.fullName ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {renderError('fullName')}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Life Status *</label>
                  <select
                    value={form.lifeStatus}
                    onChange={(event) => updateField('lifeStatus', event.target.value)}
                    className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'>
                    <option value='Single'>Single</option>
                    <option value='Married'>Married</option>
                    <option value='Religious'>Religious</option>
                    <option value='Widowed'>Widowed</option>
                  </select>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Gender *</label>
                  <select
                    value={form.gender}
                    onChange={(event) => updateField('gender', event.target.value)}
                    className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'>
                    <option value='Male'>Male</option>
                    <option value='Female'>Female</option>
                    <option value='Other'>Other</option>
                  </select>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Current Status *</label>
                  <div className='mt-2 flex flex-wrap gap-4 text-sm font-medium text-gray-600'>
                    {['Working', 'Studying', 'N/A'].map((status) => (
                      <label key={status} className='inline-flex items-center gap-2'>
                        <input
                          type='radio'
                          value={status}
                          checked={form.currentStatus === status}
                          onChange={(event) => updateField('currentStatus', event.target.value)}
                          className='h-4 w-4 border-gray-300 text-primary focus:ring-primary'
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className='grid gap-6 sm:grid-cols-2'>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Occupation *</label>
                  <input
                    type='text'
                    value={form.occupation}
                    onChange={(event) => updateField('occupation', event.target.value)}
                    placeholder='Occupation'
                    className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.occupation ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {renderError('occupation')}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Date of Birth *</label>
                  <input
                    type='date'
                    value={form.dob}
                    onChange={(event) => updateField('dob', event.target.value)}
                    className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.dob ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {renderError('dob')}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Age *</label>
                  <input
                    type='number'
                    min={1}
                    value={form.age}
                    onChange={(event) => updateField('age', event.target.value)}
                    placeholder='Age'
                    className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.age ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {renderError('age')}
                </div>
                <div className='flex items-end'>
                  <label className='flex items-center gap-3 text-sm font-medium text-gray-700'>
                    <input
                      type='checkbox'
                      checked={form.nonCatholic}
                      onChange={(event) => updateField('nonCatholic', event.target.checked)}
                      className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                    />
                    I am a Non-Catholic
                  </label>
                </div>
              </div>

              <div className='grid gap-6 sm:grid-cols-2'>
                <div className='rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-800'>
                  <div className='font-semibold'>Seat Availability for Males</div>
                  <div>{retreat.availability.male} seats available</div>
                </div>
                <div className='rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800'>
                  <div className='font-semibold'>Seat Availability for Females</div>
                  <div>{retreat.availability.female} seats available</div>
                </div>
              </div>

              <div className='rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700'>
                Family members joining the retreat can be added at the final step.
              </div>

              <div className='flex items-center justify-between pt-2 text-sm font-medium text-primary'>
                <Link href='/' className='hover:underline'>
                  Back to Home
                </Link>
              </div>
            </div>
          )}

          {step.id === 'address' && (
            <div className='space-y-6'>
              <div className='grid gap-6 sm:grid-cols-2'>
                <div>
                  <label className='text-sm font-medium text-gray-700'>House Name *</label>
                  <input
                    type='text'
                    value={form.houseName}
                    onChange={(event) => updateField('houseName', event.target.value)}
                    placeholder='House Name'
                    className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.houseName ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {renderError('houseName')}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Place *</label>
                  <input
                    type='text'
                    value={form.place}
                    onChange={(event) => updateField('place', event.target.value)}
                    placeholder='Place'
                    className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.place ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {renderError('place')}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>District</label>
                  <input
                    type='text'
                    value={form.district}
                    onChange={(event) => updateField('district', event.target.value)}
                    placeholder='District'
                    className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                  />
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>State</label>
                  <input
                    type='text'
                    value={form.state}
                    onChange={(event) => updateField('state', event.target.value)}
                    placeholder='State'
                    className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                  />
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Country</label>
                  <input
                    type='text'
                    value={form.country}
                    onChange={(event) => updateField('country', event.target.value)}
                    placeholder='Country'
                    className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                  />
                </div>
              </div>
            </div>
          )}

          {step.id === 'contact' && (
            <div className='space-y-6'>
              <div className='grid gap-6 sm:grid-cols-2'>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Please enter a phone number *</label>
                  <input
                    type='tel'
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder='Phone Number'
                    className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.phone ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {renderError('phone')}
                </div>
                <div className='flex items-end'>
                  <label className='flex items-center gap-2 text-sm font-medium text-gray-700'>
                    <input
                      type='checkbox'
                      checked={form.whatsappSame}
                      onChange={(event) => updateField('whatsappSame', event.target.checked)}
                      className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                    />
                    This is my WhatsApp number
                  </label>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>WhatsApp Number *</label>
                  <input
                    type='tel'
                    value={form.whatsapp}
                    onChange={(event) => updateField('whatsapp', event.target.value)}
                    placeholder='WhatsApp Number'
                    className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.whatsapp ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {renderError('whatsapp')}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Alternate Phone Number (optional)</label>
                  <input
                    type='tel'
                    value={form.altPhone}
                    onChange={(event) => updateField('altPhone', event.target.value)}
                    placeholder='Alternate Phone Number'
                    className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                  />
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Email Address *</label>
                  <input
                    type='email'
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder='Email Address'
                    className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {renderError('email')}
                </div>
              </div>
            </div>
          )}

          {step.id === 'parish' && (
            <div className='space-y-6'>
              {form.nonCatholic ? (
                <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
                  <p className='font-semibold'>Parish information not required</p>
                  <p className='mt-1'>
                    Because you indicated that you are a Non-Catholic guest, parish and diocese details are optional. You can continue to the
                    next step.
                  </p>
                </div>
              ) : (
                <div className='grid gap-6 sm:grid-cols-2'>
                  <div>
                    <label className='text-sm font-medium text-gray-700'>Diocese *</label>
                    <input
                      type='text'
                      value={form.diocese}
                      onChange={(event) => updateField('diocese', event.target.value)}
                      placeholder='Diocese'
                      className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.diocese ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {renderError('diocese')}
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-700'>Parish *</label>
                    <input
                      type='text'
                      value={form.parish}
                      onChange={(event) => updateField('parish', event.target.value)}
                      placeholder='Parish'
                      className={`mt-2 w-full rounded-lg border px-4 py-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.parish ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {renderError('parish')}
                  </div>
                </div>
              )}
            </div>
          )}

          {step.id === 'family' && (
            <div className='space-y-6'>
              <div className='rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600'>
                <Icon icon='solar:users-group-rounded-linear' className='mx-auto mb-3 text-3xl text-primary' />
                <p className='font-semibold text-gray-900'>No family members added yet</p>
                <p className='mt-1'>Click &quot;Add Family Member&quot; to add family members for this retreat.</p>
                <p className='mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-blue-700'>
                  Note: Only family members with the same address can be added here.
                </p>
              </div>

              <div className='flex flex-wrap items-center gap-3'>
                <button
                  type='button'
                  onClick={addFamilyMember}
                  className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90'>
                  <Icon icon='solar:user-plus-bold-duotone' className='text-lg' />
                  Add Family Member
                </button>
                <span className='text-sm text-gray-500'>
                  Family members joining the retreat can be added at the final step.
                </span>
              </div>

              {form.familyMembers.length > 0 && (
                <div className='space-y-4'>
                  {form.familyMembers.map((member, index) => (
                    <div key={index} className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
                      <div className='flex items-center justify-between'>
                        <h4 className='text-sm font-semibold text-gray-900'>Family Member {index + 1}</h4>
                        <button
                          type='button'
                          onClick={() => removeFamilyMember(index)}
                          className='text-sm font-medium text-red-500 hover:text-red-600'>
                          Remove
                        </button>
                      </div>
                      <div className='mt-4 grid gap-4 sm:grid-cols-3'>
                        <div>
                          <label className='text-sm font-medium text-gray-700'>Name</label>
                          <input
                            type='text'
                            value={member.name}
                            onChange={(event) => updateFamilyMember(index, 'name', event.target.value)}
                            className='mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                          />
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-700'>Relationship</label>
                          <input
                            type='text'
                            value={member.relationship}
                            onChange={(event) => updateFamilyMember(index, 'relationship', event.target.value)}
                            className='mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                          />
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-700'>Age</label>
                          <input
                            type='number'
                            min={0}
                            value={member.age}
                            onChange={(event) => updateFamilyMember(index, 'age', event.target.value)}
                            className='mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

      {step.id === 'payment' && (
        <div className='space-y-6'>
          <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.35em] text-gray-500'>Retreat</p>
                <p className='text-lg font-semibold text-gray-900'>{retreat.title}</p>
                <p className='text-sm text-gray-500'>{retreat.dateRange}</p>
              </div>
              <div className='text-right'>
                <p className='text-xs font-semibold uppercase tracking-[0.35em] text-gray-500'>Amount Due</p>
                <p className='text-2xl font-bold text-gray-900'>{amountLabel}</p>
              </div>
            </div>
            <div className='mt-4 grid gap-3 sm:grid-cols-2 text-sm text-gray-600'>
              <div className='rounded-xl border border-gray-200 bg-gray-50 px-4 py-3'>
                <p className='text-xs uppercase tracking-wide text-gray-500'>Primary guest</p>
                <p className='font-semibold text-gray-900'>{form.fullName || '—'}</p>
              </div>
              <div className='rounded-xl border border-gray-200 bg-gray-50 px-4 py-3'>
                <p className='text-xs uppercase tracking-wide text-gray-500'>Contact</p>
                <p className='font-semibold text-gray-900'>{form.email || form.phone || '—'}</p>
              </div>
            </div>
          </div>

          {retreat.isPaid === false ? (
            <div className='flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-emerald-800'>
              <ShieldCheck className='h-6 w-6 flex-shrink-0' />
              <div>
                <p className='text-sm font-semibold uppercase tracking-wide text-emerald-700'>No payment required</p>
                <p className='mt-2 text-sm text-emerald-700'>
                  This retreat is fully sponsored for registered guests. Click &ldquo;Complete booking&rdquo; to confirm your spot and receive
                  your ticket instantly.
                </p>
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <button
                  type='button'
                  onClick={() => updateField('paymentMethod', 'card')}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    form.paymentMethod === 'card'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary'
                  }`}>
                  <CreditCard className='h-5 w-5' />
                  Card payment
                </button>
                <button
                  type='button'
                  onClick={() => updateField('paymentMethod', 'mobile')}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    form.paymentMethod === 'mobile'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary'
                  }`}>
                  <Smartphone className='h-5 w-5' />
                  Mobile money
                </button>
              </div>

              {form.paymentMethod === 'card' ? (
                <div className='space-y-5'>
                  <div>
                    <label className='text-xs font-semibold uppercase tracking-wide text-gray-600'>Cardholder name</label>
                    <input
                      type='text'
                      value={form.cardName}
                      onChange={(event) => updateField('cardName', event.target.value)}
                      placeholder='Name on card'
                      className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                    />
                    {renderError('cardName')}
                  </div>
                  <div>
                    <label className='text-xs font-semibold uppercase tracking-wide text-gray-600'>Card number</label>
                    <input
                      type='text'
                      inputMode='numeric'
                      value={form.cardNumber}
                      onChange={(event) => updateField('cardNumber', event.target.value)}
                      placeholder='4242 4242 4242 4242'
                      className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                    />
                    {renderError('cardNumber')}
                  </div>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div>
                      <label className='text-xs font-semibold uppercase tracking-wide text-gray-600'>Expiry (MM/YY)</label>
                      <input
                        type='text'
                        value={form.cardExpiry}
                        onChange={(event) => updateField('cardExpiry', event.target.value)}
                        placeholder='MM / YY'
                        className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                      />
                      {renderError('cardExpiry')}
                    </div>
                    <div>
                      <label className='text-xs font-semibold uppercase tracking-wide text-gray-600'>CVC</label>
                      <input
                        type='password'
                        maxLength={4}
                        value={form.cardCvc}
                        onChange={(event) => updateField('cardCvc', event.target.value)}
                        placeholder='123'
                        className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                      />
                      {renderError('cardCvc')}
                    </div>
                  </div>
                  <div className='flex flex-wrap gap-2 text-xs text-gray-400'>
                    {cardLogos.map((logo) => (
                      <span key={logo} className='rounded-full border border-gray-200 px-3 py-1'>
                        {logo}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='space-y-5'>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div>
                      <label className='text-xs font-semibold uppercase tracking-wide text-gray-600'>Mobile network</label>
                      <select
                        value={form.mobileNetwork}
                        onChange={(event) => updateField('mobileNetwork', event.target.value)}
                        className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'>
                        {mobileNetworks.map((network) => (
                          <option key={network} value={network}>
                            {network}
                          </option>
                        ))}
                      </select>
                      {renderError('mobileNetwork')}
                    </div>
                    <div>
                      <label className='text-xs font-semibold uppercase tracking-wide text-gray-600'>Mobile number</label>
                      <input
                        type='tel'
                        value={form.mobileNumber}
                        onChange={(event) => updateField('mobileNumber', event.target.value)}
                        placeholder='07XX XXX XXX'
                        className='mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                      />
                      {renderError('mobileNumber')}
                    </div>
                  </div>
                  <div className='rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500'>
                    A secure payment request will be initiated to your mobile wallet. Confirm the prompt on your device to complete the
                    payment.
                  </div>
                </div>
              )}
            </div>
          )}
                </div>
              )}

              <div className='rounded-xl border border-gray-200 bg-gray-50 px-4 py-3'>
                <label className='flex items-center gap-3 text-sm font-medium text-gray-700'>
                  <input
                    type='checkbox'
                    checked={form.acceptInstructions}
                    onChange={(event) => updateField('acceptInstructions', event.target.checked)}
                    className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                  />
                  <span>
                    I have read and agree to the{' '}
                    <Link href='#' className='text-primary underline'>
                      instructions
                    </Link>
                    .
                  </span>
                </label>
                {renderError('acceptInstructions')}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='flex flex-col gap-4 sm:flex-row sm:justify-between'>
        <button
          type='button'
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`inline-flex items-center justify-center rounded-lg border px-6 py-3 text-sm font-semibold transition ${
            currentStep === 0
              ? 'cursor-not-allowed border-gray-200 text-gray-300'
              : 'border-gray-300 text-gray-700 hover:border-primary/50 hover:text-primary'
          }`}>
          Back
        </button>
        {currentStep < steps.length - 1 ? (
          <button
            type='button'
            onClick={handleNext}
            className='inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90'>
            Next Step
          </button>
        ) : (
          <button
            type='button'
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition ${
              isSubmitting ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
            }`}>
            {isSubmitting ? 'Processing...' : 'Complete booking'}
          </button>
        )}
      </div>
    </div>
  )
}

export default RetreatBookingForm



