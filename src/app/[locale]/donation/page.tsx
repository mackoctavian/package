import type { Metadata } from 'next'
import { Quote } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import DonationFlow from '@/app/components/giving/DonationFlow'
import { givingFunds as funds } from '@/app/data/giving'
import { imagery } from '@/app/data/site'
import { getT, setRequestLocale } from '@/i18n/server'
import { pageMetadata, resolveLocale, type LocaleParams } from '@/i18n/page'

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getT(locale)
  return pageMetadata(locale, '/donation', { title: t('giving.donation.metaTitle'), description: t('giving.donation.metaDescription') })
}

export default async function DonationPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  setRequestLocale(locale)
  const t = await getT(locale)
  return (
    <main>
      <section className='relative isolate overflow-hidden bg-navy-950 !py-0'>
        <SmartImage src={imagery.prayerHands} alt='' fill priority sizes='100vw' className='-z-10 object-cover opacity-35' />
        <div className='absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/40' />
        <div className='container py-20 sm:py-24'>
          <p className='eyebrow text-gold-300'>{t('giving.donation.eyebrow')}</p>
          <h1 className='mt-4 max-w-3xl text-5xl leading-[1.05] text-white sm:text-6xl'>{t('giving.donation.title')}</h1>
          <p className='mt-5 max-w-xl text-lg text-navy-100'>{t('giving.donation.text')}</p>
        </div>
      </section>

      <section className='py-14 sm:py-20'>
        <div className='container grid gap-10 lg:grid-cols-12'>
          <div className='lg:col-span-7 lg:order-2'>
            <DonationFlow />
          </div>
          <aside className='space-y-6 lg:col-span-5 lg:order-1'>
            <div className='rounded-[2rem] bg-parchment p-8'>
              <h2 className='text-3xl'>{t('giving.donation.whereTitle')}</h2>
              <ul className='mt-6 space-y-5'>
                {funds.map((fund) => (
                  <li key={fund.id} className='flex gap-4'>
                    <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gold-700'>
                      <fund.icon className='h-5 w-5' />
                    </span>
                    <div>
                      <p className='font-semibold text-navy-900'>{t(`giving.funds.${fund.id}.label`)}</p>
                      <p className='text-sm text-muted-foreground'>{t(`giving.funds.${fund.id}.text`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <figure className='rounded-[2rem] bg-navy-900 p-8 text-white'>
              <Quote className='h-8 w-8 text-gold-400' />
              <blockquote className='mt-4 font-display text-2xl leading-snug'>{t('giving.donation.quote')}</blockquote>
              <figcaption className='mt-4 text-sm uppercase tracking-widest text-navy-200'>{t('giving.donation.quoteRef')}</figcaption>
            </figure>
          </aside>
        </div>
      </section>
    </main>
  )
}
