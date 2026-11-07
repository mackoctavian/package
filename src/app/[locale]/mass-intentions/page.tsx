import type { Metadata } from 'next'
import { CalendarDays, Clock, HandCoins } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import MassIntentionForm from '@/app/components/giving/MassIntentionForm'
import { imagery } from '@/app/data/site'
import { getT, setRequestLocale } from '@/i18n/server'
import { pageMetadata, resolveLocale, type LocaleParams } from '@/i18n/page'
import { formatMoney } from '@/i18n/format'
import { SUGGESTED_OFFERING_PER_MASS } from '@/app/data/giving'

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getT(locale)
  return pageMetadata(locale, '/mass-intentions', { title: t('giving.mass.metaTitle'), description: t('giving.mass.metaDescription') })
}

const massTimes = ['weekdays', 'friday', 'sunday'] as const

export default async function MassIntentionsPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  setRequestLocale(locale)
  const t = await getT(locale)
  return (
    <main>
      <section className='relative isolate overflow-hidden bg-navy-950 !py-0'>
        <SmartImage src={imagery.churchInterior} alt='' fill priority sizes='100vw' className='-z-10 object-cover opacity-35' />
        <div className='absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/40' />
        <div className='container py-20 sm:py-24'>
          <p className='eyebrow text-gold-300'>{t('giving.mass.eyebrow')}</p>
          <h1 className='mt-4 max-w-3xl text-5xl leading-[1.05] text-white sm:text-6xl'>{t('giving.mass.title')}</h1>
          <p className='mt-5 max-w-xl text-lg text-navy-100'>{t('giving.mass.text')}</p>
        </div>
      </section>

      <section className='py-14 sm:py-20'>
        <div className='container grid gap-10 lg:grid-cols-12'>
          <div className='lg:col-span-7 lg:order-2'>
            <MassIntentionForm />
          </div>

          <aside className='space-y-6 lg:col-span-5 lg:order-1'>
            <div className='rounded-[2rem] bg-parchment p-8'>
              <h2 className='text-3xl'>{t('giving.mass.whatTitle')}</h2>
              <p className='mt-4 leading-relaxed text-navy-700'>{t('giving.mass.whatText')}</p>
            </div>

            <div className='rounded-[2rem] border border-border bg-white p-8'>
              <h3 className='flex items-center gap-2 font-display text-2xl font-semibold text-navy-900'>
                <Clock className='h-5 w-5 text-gold-500' /> {t('giving.mass.timesTitle')}
              </h3>
              <ul className='mt-5 divide-y divide-border'>
                {massTimes.map((item) => (
                  <li key={item} className='flex justify-between gap-4 py-3 text-sm'>
                    <span className='text-muted-foreground'>{t(`giving.mass.times.${item}.day`)}</span>
                    <span className='font-medium text-navy-900'>{t(`giving.mass.times.${item}.time`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-1'>
              <div className='flex gap-4 rounded-[2rem] border border-border bg-white p-6'>
                <CalendarDays className='h-6 w-6 shrink-0 text-gold-500' />
                <p className='text-sm leading-relaxed text-navy-700'>{t('giving.mass.dateNote')}</p>
              </div>
              <div className='flex gap-4 rounded-[2rem] border border-border bg-white p-6'>
                <HandCoins className='h-6 w-6 shrink-0 text-gold-500' />
                <p className='text-sm leading-relaxed text-navy-700'>
                  {t('giving.mass.offeringNote', { amount: formatMoney(SUGGESTED_OFFERING_PER_MASS, locale) })}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
