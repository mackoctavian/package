'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Loader2, Mail, MapPin, Phone, Send } from 'lucide-react'

import { Honeypot } from '@/app/components/site/FormFields'
import { Button } from '@/app/components/ui/button'
import { siteConfig } from '@/app/data/site'
import { useT } from '@/i18n/client'
import { cn } from '@/lib/utils'

const emptyForm = { firstname: '', lastname: '', email: '', phnumber: '', message: '' }

const fieldClass =
  'w-full rounded-xl border border-input bg-white px-4 py-3 text-navy-900 placeholder:text-navy-300 transition focus:border-gold-400 focus:outline-none focus:ring-4 focus:ring-gold-200/50'

export default function ContactSection() {
  const t = useT()
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [website, setWebsite] = useState('')

  const update = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('submitting')
    setError(null)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, metadata: { source: 'homepage-contact' }, website }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? t('home.contact.error'))
      }
      setForm(emptyForm)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('home.contact.error'))
      setStatus('error')
    }
  }

  const details = [
    { icon: MapPin, label: t('home.contact.visit'), lines: [siteConfig.contact.address, siteConfig.contact.postal], href: siteConfig.contact.mapsHref },
    { icon: Phone, label: t('home.contact.call'), lines: [siteConfig.contact.phone, siteConfig.contact.secondaryPhone], href: siteConfig.contact.phoneHref },
    { icon: Mail, label: t('home.contact.email'), lines: [siteConfig.contact.email], href: `mailto:${siteConfig.contact.email}` },
    { icon: Clock, label: t('home.contact.hours'), lines: [t('common.officeHours.weekdays'), t('common.officeHours.saturday')] },
  ]

  return (
    <section id='contact' className='py-24 sm:py-28'>
      <div className='container grid gap-12 lg:grid-cols-12'>
        <div className='lg:col-span-5'>
          <p className='eyebrow'>{t('home.contact.eyebrow')}</p>
          <h2 className='mt-3 text-4xl leading-tight sm:text-5xl'>{t('home.contact.title')}</h2>
          <p className='mt-4 text-lg text-muted-foreground'>{t('home.contact.text')}</p>
          <ul className='mt-10 grid gap-6 sm:grid-cols-2'>
            {details.map((item) => (
              <li key={item.label} className='flex gap-4'>
                <span aria-hidden='true' className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-300'>
                  <item.icon className='h-5 w-5' />
                </span>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>{item.label}</p>
                  {item.lines.map((line) =>
                    item.href ? (
                      <p key={line}>
                        <a href={item.href} className='text-navy-900 hover:text-gold-600' target={item.href.startsWith('http') ? '_blank' : undefined} rel='noopener noreferrer'>
                          {line}
                        </a>
                      </p>
                    ) : (
                      <p key={line} className='text-navy-900'>
                        {line}
                      </p>
                    ),
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className='lg:col-span-7'>
          <div className='rounded-[2rem] border border-border bg-white p-6 shadow-soft sm:p-10'>
            {status === 'success' ? (
              <div className='flex flex-col items-center py-12 text-center'>
                <CheckCircle2 className='h-14 w-14 text-emerald-600' />
                <h3 className='mt-5 font-display text-3xl text-navy-900'>{t('home.contact.successTitle')}</h3>
                <p className='mt-2 max-w-sm text-muted-foreground'>{t('home.contact.successText')}</p>
                <Button variant='outline' size='pill' className='mt-8' onClick={() => setStatus('idle')}>
                  {t('home.contact.another')}
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className='grid gap-5 sm:grid-cols-2'>
                <Honeypot value={website} onChange={setWebsite} />
                <label className='block'>
                  <span className='mb-1.5 block text-sm font-medium text-navy-800'>{t('home.contact.firstName')}</span>
                  <input required name='firstname' autoComplete='given-name' value={form.firstname} onChange={update} className={fieldClass} />
                </label>
                <label className='block'>
                  <span className='mb-1.5 block text-sm font-medium text-navy-800'>{t('home.contact.lastName')}</span>
                  <input required name='lastname' autoComplete='family-name' value={form.lastname} onChange={update} className={fieldClass} />
                </label>
                <label className='block'>
                  <span className='mb-1.5 block text-sm font-medium text-navy-800'>{t('home.contact.emailLabel')}</span>
                  <input required type='email' name='email' autoComplete='email' value={form.email} onChange={update} className={fieldClass} />
                </label>
                <label className='block'>
                  <span className='mb-1.5 block text-sm font-medium text-navy-800'>{t('home.contact.phone')}</span>
                  <input
                    required
                    type='tel'
                    name='phnumber'
                    autoComplete='tel'
                    placeholder='+255 …'
                    value={form.phnumber}
                    onChange={update}
                    className={fieldClass}
                  />
                </label>
                <label className='block sm:col-span-2'>
                  <span className='mb-1.5 block text-sm font-medium text-navy-800'>{t('home.contact.message')}</span>
                  <textarea
                    required
                    minLength={5}
                    name='message'
                    rows={5}
                    value={form.message}
                    onChange={update}
                    className={cn(fieldClass, 'resize-none')}
                  />
                </label>
                {status === 'error' && error && (
                  <p role='alert' className='rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2'>
                    {error}
                  </p>
                )}
                <div className='sm:col-span-2'>
                  <Button type='submit' size='xl' disabled={status === 'submitting'} className='w-full sm:w-auto'>
                    {status === 'submitting' ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Send className='mr-2 h-4 w-4' />}
                    {t('home.contact.send')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
