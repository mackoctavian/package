import type { Metadata } from 'next'
import { Link } from '@/i18n/link'
import { pageMetadata, resolveLocale, type LocaleParams } from '@/i18n/page'
import { getT, setRequestLocale } from '@/i18n/server'
import { ArrowRight, HeartHandshake, Mail, Phone } from 'lucide-react'

import PageHero from '@/app/components/site/PageHero'
import SmartImage from '@/app/components/site/SmartImage'
import SectionHeading from '@/app/components/site/SectionHeading'
import { Button } from '@/app/components/ui/button'
import { imagery, siteConfig } from '@/app/data/site'
import { getMinistries } from '@/lib/ministries/queries'

export const revalidate = 300

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getT(locale)
  return pageMetadata(locale, '/ministries', { title: t('pages.ministries.metaTitle'), description: t('pages.ministries.metaDescription') })
}

export default async function MinistriesPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  setRequestLocale(locale)
  const t = await getT(locale)
  const ministries = await getMinistries(locale)

  return (
    <main>
      <PageHero
        eyebrow={t('pages.ministries.eyebrow')}
        title={t('pages.ministries.title')}
        image={imagery.community}
        description={t('pages.ministries.description')}
        aside={
          <div className='flex gap-8 text-white'>
            <div>
              <p className='font-display text-5xl font-semibold'>{ministries.length}</p>
              <p className='text-sm text-navy-200'>{t('pages.ministries.active')}</p>
            </div>
          </div>
        }
      />

      <section>
        <div className='container'>
          <SectionHeading
            eyebrow={t('pages.ministries.findEyebrow')}
            title={t('pages.ministries.findTitle')}
            description={t('pages.ministries.findDescription')}
          />
          <div className='mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
            {ministries.map((ministry) => (
              <article
                key={ministry.id}
                className='group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift'
              >
                <div className='relative aspect-[16/10] overflow-hidden'>
                  <SmartImage
                    src={ministry.heroImage}
                    alt=''
                    fill
                    sizes='(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw'
                    className='object-cover transition-transform duration-700 group-hover:scale-105'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-navy-950/50 to-transparent' />
                  {ministry.focusAreas?.length ? (
                    <span className='absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy-800'>
                      {t('pages.ministries.focusCount', { count: ministry.focusAreas.length })}
                    </span>
                  ) : null}
                </div>
                <div className='flex flex-1 flex-col p-6'>
                  <h2 className='font-display text-2xl font-semibold leading-snug text-navy-900'>
                    <Link href={`/ministries/${ministry.slug}`} className='after:absolute after:inset-0 focus-visible:outline-none'>
                      {ministry.title}
                    </Link>
                  </h2>
                  <p className='mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground'>{ministry.shortDescription}</p>
                  {ministry.gatherings?.[0] && (
                    <p className='mt-4 rounded-xl bg-parchment px-3 py-2 text-xs text-navy-700'>
                      <span className='font-semibold'>{ministry.gatherings[0].day}</span> · {ministry.gatherings[0].time}
                    </p>
                  )}
                  <span className='mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900'>
                    {t('pages.ministries.explore')} <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='!pt-0'>
        <div className='container'>
          <div className='relative isolate overflow-hidden rounded-[2rem] bg-navy-900 px-8 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-10'>
            <SmartImage src={imagery.candles} alt='' fill sizes='100vw' className='-z-10 object-cover opacity-20' />
            <div className='max-w-xl'>
              <HeartHandshake className='h-9 w-9 text-gold-400' />
              <h2 className='mt-4 text-4xl text-white'>{t('pages.ministries.unsureTitle')}</h2>
              <p className='mt-3 text-navy-100'>{t('pages.ministries.unsureText')}</p>
            </div>
            <div className='mt-8 flex flex-wrap gap-3 lg:mt-0'>
              <Button asChild variant='gold' size='pill'>
                <a href={siteConfig.contact.phoneHref}>
                  <Phone className='mr-2 h-4 w-4' /> {siteConfig.contact.phone}
                </a>
              </Button>
              <Button asChild variant='outline-light' size='pill'>
                <a href={`mailto:${siteConfig.contact.email}`}>
                  <Mail className='mr-2 h-4 w-4' /> {t('pages.ministries.emailUs')}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
