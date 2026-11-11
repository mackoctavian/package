import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BookOpen, Store, Truck } from 'lucide-react'

import { BookshopProvider } from '@/app/components/publications/Bookshop'
import PublicationShop from '@/app/components/publications/PublicationShop'
import PageHero from '@/app/components/site/PageHero'
import { imagery } from '@/app/data/site'
import { formatMoney } from '@/i18n/format'
import { pageMetadata, resolveLocale, type LocaleParams } from '@/i18n/page'
import { getT, setRequestLocale } from '@/i18n/server'
import { DELIVERY_FEE } from '@/lib/publications/format'
import { getPublications } from '@/lib/publications/queries'

export const revalidate = 300

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getT(locale)
  return pageMetadata(locale, '/publications', { title: t('publications.metaTitle'), description: t('publications.metaDescription') })
}

export default async function PublicationsPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  setRequestLocale(locale)
  const t = await getT(locale)
  const publications = await getPublications(locale)

  const perks = [
    { icon: Store, title: t('publications.perks.collect.title'), text: t('publications.perks.collect.text') },
    { icon: Truck, title: t('publications.perks.delivery.title'), text: t('publications.perks.delivery.text', { fee: formatMoney(DELIVERY_FEE, locale) }) },
    { icon: BookOpen, title: t('publications.perks.languages.title'), text: t('publications.perks.languages.text') },
  ]

  return (
    <BookshopProvider catalogue={publications}>
      <main>
        <PageHero
          eyebrow={t('publications.eyebrow')}
          title={t('publications.title')}
          image={imagery.bibleReading}
          description={t('publications.description')}
        />
        <div className='border-b border-border bg-parchment/60'>
          <div className='container grid gap-4 py-6 sm:grid-cols-3'>
            {perks.map((perk) => (
              <div key={perk.title} className='flex items-start gap-3'>
                <perk.icon className='mt-0.5 h-5 w-5 shrink-0 text-gold-700' />
                <div>
                  <p className='text-sm font-semibold text-navy-900'>{perk.title}</p>
                  <p className='text-xs text-muted-foreground'>{perk.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <section>
          <div className='container'>
            <Suspense>
              <PublicationShop publications={publications} />
            </Suspense>
          </div>
        </section>
      </main>
    </BookshopProvider>
  )
}
