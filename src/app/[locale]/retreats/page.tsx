import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Link } from '@/i18n/link'
import { getT, setRequestLocale } from '@/i18n/server'
import { pageMetadata, resolveLocale, type LocaleParams } from '@/i18n/page'
import { Ticket } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import RetreatExplorer from '@/app/components/Retreats/listing/RetreatExplorer'
import { imagery } from '@/app/data/site'
import { getAllRetreats, toListItems } from '@/lib/retreats/queries'

export const revalidate = 60

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getT(locale)
  return pageMetadata(locale, '/retreats', { title: t('retreats.metaTitle'), description: t('retreats.metaDescription') })
}

export default async function RetreatsPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  setRequestLocale(locale)
  const t = await getT(locale)
  const { retreats } = await getAllRetreats(locale)
  const items = toListItems(retreats)

  return (
    <main>
      <section className='relative isolate overflow-hidden bg-navy-950 !py-0'>
        <SmartImage src={imagery.sunriseHills} alt='' fill priority sizes='100vw' className='-z-10 object-cover opacity-35' />
        <div className='absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/40' />
        <div className='container flex flex-col gap-8 py-20 sm:py-24 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl'>
            <p className='eyebrow text-gold-300'>{t('retreats.page.eyebrow')}</p>
            <h1 className='mt-4 text-5xl leading-[1.05] text-white sm:text-6xl'>{t('retreats.page.title')}</h1>
            <p className='mt-5 text-lg text-navy-100'>{t('retreats.page.description')}</p>
          </div>
          <Link
            href='/retreats/check-booking'
            className='inline-flex w-fit items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10'
          >
            <Ticket className='h-4 w-4 text-gold-300' /> {t('retreats.page.manage')}
          </Link>
        </div>
      </section>

      <section className='py-10 sm:py-14'>
        <div className='container'>
          <Suspense>
            <RetreatExplorer retreats={items} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
