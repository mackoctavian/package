'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Heart, 
  Sparkles, 
  Check, 
  Send, 
  Church,
  Flame,
  Cross,
  Users
} from 'lucide-react'
import Link from 'next/link'

type IntentionType = 'thanksgiving' | 'healing' | 'deceased' | 'special' | 'family'

interface FormState {
  fullName: string
  email: string
  phone: string
  intentionType: IntentionType
  intentionFor: string
  intentionDetails: string
  preferredDate: string
  numberOfMasses: number
  donationAmount: string
  acceptTerms: boolean
}

const initialState: FormState = {
  fullName: '',
  email: '',
  phone: '',
  intentionType: 'thanksgiving',
  intentionFor: '',
  intentionDetails: '',
  preferredDate: '',
  numberOfMasses: 1,
  donationAmount: '',
  acceptTerms: false,
}

const intentionTypes: { id: IntentionType; label: string; icon: typeof Heart; description: string; color: string }[] = [
  { 
    id: 'thanksgiving', 
    label: 'Thanksgiving', 
    icon: Sparkles, 
    description: 'Give thanks for blessings received',
    color: 'bg-amber-500'
  },
  { 
    id: 'healing', 
    label: 'Healing', 
    icon: Heart, 
    description: 'Pray for physical or spiritual healing',
    color: 'bg-rose-500'
  },
  { 
    id: 'deceased', 
    label: 'For the Deceased', 
    icon: Cross, 
    description: 'Remember loved ones who have passed',
    color: 'bg-purple-500'
  },
  { 
    id: 'special', 
    label: 'Special Intention', 
    icon: Flame, 
    description: 'Any other prayer intention',
    color: 'bg-blue-500'
  },
  { 
    id: 'family', 
    label: 'Family Blessing', 
    icon: Users, 
    description: 'Prayers for your family',
    color: 'bg-emerald-500'
  },
]

export default function MassIntentionsPage() {
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {}

    if (!form.fullName.trim()) newErrors.fullName = 'Please enter your name'
    if (!form.email.trim()) newErrors.email = 'Please enter your email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Please enter a valid email'
    if (!form.phone.trim()) newErrors.phone = 'Please enter your phone number'
    if (!form.intentionFor.trim()) newErrors.intentionFor = 'Please specify who this intention is for'
    if (!form.intentionDetails.trim()) newErrors.intentionDetails = 'Please provide intention details'
    if (!form.acceptTerms) newErrors.acceptTerms = 'You must accept the terms'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSuccess(true)
    setForm(initialState)
  }

  if (isSuccess) {
    return (
      <main className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
        <section className='pt-32 pb-20'>
          <div className='container mx-auto max-w-2xl px-4'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className='text-center bg-white rounded-3xl p-12 shadow-xl border border-slate-100'
            >
              <div className='w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center'>
                <Check className='w-10 h-10 text-emerald-600' />
              </div>
              <h1 className='text-3xl font-bold text-slate-900 mb-4'>
                Intention Submitted Successfully
              </h1>
              <p className='text-slate-600 mb-8 max-w-md mx-auto'>
                Thank you for your Mass intention. It has been received and will be presented 
                at the altar during the Holy Sacrifice of the Mass. You will receive a confirmation email shortly.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <button
                  onClick={() => setIsSuccess(false)}
                  className='px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors'
                >
                  Submit Another Intention
                </button>
                <Link
                  href='/'
                  className='px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-primary/50 hover:text-primary transition-colors'
                >
                  Return Home
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      {/* Hero Section */}
      <section className='pt-32 pb-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[url("/images/banner/Stars.svg")] opacity-20' />
        <div className='absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/10 to-transparent' />
        <div className='container mx-auto max-w-4xl px-4 relative'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center'
          >
            <span className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-6'>
              <Church className='w-4 h-4' />
              Holy Mass Offering
            </span>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight'>
              Mass Intentions
            </h1>
            <p className='text-lg text-white/70 leading-relaxed max-w-2xl mx-auto'>
              Offer a Mass for your loved ones, for thanksgiving, healing, or any special intention. 
              Every intention is placed on the altar during the Holy Eucharist.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className='py-16'>
        <div className='container mx-auto max-w-4xl px-4'>
          <div className='grid gap-8 lg:grid-cols-3'>
            {/* Info Sidebar */}
            <div className='lg:col-span-1 space-y-6'>
              <div className='bg-gradient-to-br from-primary/10 to-purple-100 rounded-3xl p-6 border border-primary/20'>
                <h3 className='text-lg font-bold text-slate-900 mb-4 flex items-center gap-2'>
                  <Flame className='w-5 h-5 text-primary' />
                  About Mass Intentions
                </h3>
                <div className='space-y-3 text-sm text-slate-600'>
                  <p>
                    A Mass intention is a special prayer offered during the celebration of the Holy Eucharist 
                    for a particular person, group, or purpose.
                  </p>
                  <p>
                    Intentions are placed on the altar every Friday vigil and Sunday Eucharist at Divine Mercy Retreat Center.
                  </p>
                </div>
              </div>

              <div className='bg-white rounded-3xl p-6 border border-slate-100 shadow-sm'>
                <h3 className='text-lg font-bold text-slate-900 mb-4'>When are Masses offered?</h3>
                <ul className='space-y-3 text-sm text-slate-600'>
                  <li className='flex items-start gap-3'>
                    <Calendar className='w-4 h-4 text-primary mt-0.5 flex-shrink-0' />
                    <span>Friday Vigil Mass - 6:00 PM</span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Calendar className='w-4 h-4 text-primary mt-0.5 flex-shrink-0' />
                    <span>Sunday Morning - 8:00 AM & 10:30 AM</span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Calendar className='w-4 h-4 text-primary mt-0.5 flex-shrink-0' />
                    <span>Daily Mass - Monday to Thursday 7:00 AM</span>
                  </li>
                </ul>
              </div>

              <div className='bg-amber-50 rounded-3xl p-6 border border-amber-200'>
                <h3 className='text-lg font-bold text-amber-900 mb-2'>Suggested Offering</h3>
                <p className='text-sm text-amber-800'>
                  While there is no fixed amount for Mass intentions, a free-will offering is customary 
                  and supports the mission of the retreat center. The suggested offering is TZS 10,000 per Mass.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className='lg:col-span-2'>
              <form onSubmit={handleSubmit} className='bg-white rounded-3xl p-8 shadow-xl border border-slate-100'>
                <h2 className='text-2xl font-bold text-slate-900 mb-8'>Submit Your Intention</h2>

                {/* Intention Type Selection */}
                <div className='mb-8'>
                  <label className='block text-sm font-semibold text-slate-700 mb-4'>
                    Type of Intention *
                  </label>
                  <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                    {intentionTypes.map((type) => {
                      const Icon = type.icon
                      const isSelected = form.intentionType === type.id
                      return (
                        <button
                          key={type.id}
                          type='button'
                          onClick={() => updateField('intentionType', type.id)}
                          className={`p-4 rounded-2xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl ${type.color} flex items-center justify-center mb-3`}>
                            <Icon className='w-5 h-5 text-white' />
                          </div>
                          <p className='font-semibold text-slate-900 text-sm'>{type.label}</p>
                          <p className='text-xs text-slate-500 mt-1'>{type.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Personal Information */}
                <div className='space-y-6 mb-8'>
                  <h3 className='text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2'>
                    Your Information
                  </h3>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div>
                      <label className='block text-sm font-medium text-slate-700 mb-2'>Full Name *</label>
                      <input
                        type='text'
                        value={form.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder='Enter your full name'
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.fullName ? 'border-red-400' : 'border-slate-200'
                        } focus:border-primary focus:ring-1 focus:ring-primary outline-none transition`}
                      />
                      {errors.fullName && <p className='mt-1 text-sm text-red-500'>{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-slate-700 mb-2'>Email Address *</label>
                      <input
                        type='email'
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder='your@email.com'
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.email ? 'border-red-400' : 'border-slate-200'
                        } focus:border-primary focus:ring-1 focus:ring-primary outline-none transition`}
                      />
                      {errors.email && <p className='mt-1 text-sm text-red-500'>{errors.email}</p>}
                    </div>
                    <div className='sm:col-span-2'>
                      <label className='block text-sm font-medium text-slate-700 mb-2'>Phone Number *</label>
                      <input
                        type='tel'
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder='+255 XXX XXX XXX'
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.phone ? 'border-red-400' : 'border-slate-200'
                        } focus:border-primary focus:ring-1 focus:ring-primary outline-none transition`}
                      />
                      {errors.phone && <p className='mt-1 text-sm text-red-500'>{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Intention Details */}
                <div className='space-y-6 mb-8'>
                  <h3 className='text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2'>
                    Intention Details
                  </h3>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                      This intention is for *
                    </label>
                    <input
                      type='text'
                      value={form.intentionFor}
                      onChange={(e) => updateField('intentionFor', e.target.value)}
                      placeholder='e.g., John Doe, The Smith Family, My grandmother'
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.intentionFor ? 'border-red-400' : 'border-slate-200'
                      } focus:border-primary focus:ring-1 focus:ring-primary outline-none transition`}
                    />
                    {errors.intentionFor && <p className='mt-1 text-sm text-red-500'>{errors.intentionFor}</p>}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                      Intention Details *
                    </label>
                    <textarea
                      value={form.intentionDetails}
                      onChange={(e) => updateField('intentionDetails', e.target.value)}
                      placeholder='Please describe your intention...'
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.intentionDetails ? 'border-red-400' : 'border-slate-200'
                      } focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none`}
                    />
                    {errors.intentionDetails && <p className='mt-1 text-sm text-red-500'>{errors.intentionDetails}</p>}
                  </div>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div>
                      <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Preferred Date (optional)
                      </label>
                      <input
                        type='date'
                        value={form.preferredDate}
                        onChange={(e) => updateField('preferredDate', e.target.value)}
                        className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Number of Masses
                      </label>
                      <select
                        value={form.numberOfMasses}
                        onChange={(e) => updateField('numberOfMasses', parseInt(e.target.value))}
                        className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition'
                      >
                        {[1, 2, 3, 5, 10, 30].map((num) => (
                          <option key={num} value={num}>{num} Mass{num > 1 ? 'es' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                      Offering Amount (optional)
                    </label>
                    <div className='relative'>
                      <span className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm'>TZS</span>
                      <input
                        type='text'
                        value={form.donationAmount}
                        onChange={(e) => updateField('donationAmount', e.target.value)}
                        placeholder='10,000'
                        className='w-full pl-14 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition'
                      />
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>Suggested: TZS 10,000 per Mass</p>
                  </div>
                </div>

                {/* Terms */}
                <div className='mb-8'>
                  <label className='flex items-start gap-3 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={form.acceptTerms}
                      onChange={(e) => updateField('acceptTerms', e.target.checked)}
                      className='mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary'
                    />
                    <span className='text-sm text-slate-600'>
                      I understand that Mass intentions are offered during the Holy Sacrifice of the Mass 
                      and I accept that the timing may depend on the parish schedule. *
                    </span>
                  </label>
                  {errors.acceptTerms && <p className='mt-1 text-sm text-red-500'>{errors.acceptTerms}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    isSubmitting 
                      ? 'bg-primary/60 cursor-not-allowed' 
                      : 'bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/30'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full'
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className='w-5 h-5' />
                      Submit Mass Intention
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

