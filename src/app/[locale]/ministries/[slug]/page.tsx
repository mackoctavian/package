import type { Metadata } from 'next'
import { Link } from '@/i18n/link'
import { formatDate } from '@/i18n/format'
import { pageMetadata, resolveLocale, type LocaleParams } from '@/i18n/page'
import { getT, setRequestLocale } from '@/i18n/server'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, CalendarDays, Mail, Phone, Quote, UserRound } from 'lucide-react'

import PageHero from '@/app/components/site/PageHero'
import SmartImage from '@/app/components/site/SmartImage'
import { Button } from '@/app/components/ui/button'
import { ministriesData } from '@/app/data/ministries'
import { getMinistryBySlug } from '@/lib/ministries/queries'

export const revalidate = 300

type MinistryRouteProps = LocaleParams<{ slug: string }>

// Runs once per locale from the parent layout's params.
export const generateStaticParams = () => ministriesData.map((ministry) => ({ slug: ministry.slug }))

export async function generateMetadata({ params }: MinistryRouteProps): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const result = await getMinistryBySlug(slug, locale)
  if (!result) return { title: (await getT(locale))('pages.ministries.notFound') }
  return pageMetadata(locale, `/ministries/${slug}`, { title: result.ministry.title, description: result.ministry.shortDescription })
}

export default async function MinistryDetailPage({ params }: MinistryRouteProps) {
  const locale = await resolveLocale(params)
  setRequestLocale(locale)
  const { slug } = await params
  const t = await getT(locale)
  const result = await getMinistryBySlug(slug, locale)
  if (!result) notFound()
  const { ministry, others } = result

  return (
    <main>
      <PageHero eyebrow={t('pages.ministries.detail.eyebrow')} title={ministry.title} image={ministry.heroImage} description={ministry.shortDescription}>
        <Link href='/ministries' className='mt-8 inline-flex items-center gap-2 text-sm font-medium text-gold-300 hover:text-gold-200'>
          <ArrowLeft className='h-4 w-4' /> {t('pages.ministries.detail.all')}
        </Link>
      </PageHero>

      <section>
        <div className='container grid gap-12 lg:grid-cols-12'>
          <div className='space-y-14 lg:col-span-8'>
            <div>
              <p className='eyebrow'>{t('pages.ministries.detail.overview')}</p>
              <p className='mt-4 text-lg leading-relaxed text-navy-800'>{ministry.overview}</p>
            </div>

            {ministry.focusAreas?.length ? (
              <div>
                <h2 className='text-4xl'>{t('pages.ministries.detail.focusAreas')}</h2>
                <div className='mt-6 grid gap-4 sm:grid-cols-2'>
                  {ministry.focusAreas.map((area, index) => (
                    <div key={area.title} className='rounded-2xl border border-border bg-white p-6'>
                      <span className='font-display text-2xl font-semibold text-gold-500'>{String(index + 1).padStart(2, '0')}</span>
                      <h3 className='mt-2 font-sans text-lg font-semibold text-navy-900'>{area.title}</h3>
                      {area.description && <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>{area.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {ministry.activities?.length ? (
              <div>
                <h2 className='text-4xl'>{t('pages.ministries.detail.activities')}</h2>
                <div className='mt-6 grid gap-6 sm:grid-cols-2'>
                  {ministry.activities.map((activity) => (
                    <article key={activity.id} className='overflow-hidden rounded-3xl border border-border bg-white shadow-soft'>
                      <div className='relative aspect-[16/10]'>
                        <SmartImage src={activity.image} alt={activity.title} fill sizes='(min-width: 1024px) 30vw, 100vw' className='object-cover' />
                      </div>
                      <div className='p-6'>
                        {formatDate(activity.date, locale) && (
                          <p className='text-xs font-semibold uppercase tracking-widest text-gold-700'>{formatDate(activity.date, locale)}</p>
                        )}
                        <h3 className='mt-2 font-display text-2xl font-semibold text-navy-900'>{activity.title}</h3>
                        <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>{activity.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className='space-y-6 lg:col-span-4'>
            <div className='space-y-6 lg:sticky lg:top-28'>
              {ministry.highlightScripture && (
                <figure className='rounded-[2rem] bg-navy-900 p-8 text-white'>
                  <Quote className='h-7 w-7 text-gold-400' />
                  <blockquote className='mt-3 font-display text-2xl leading-snug'>{ministry.highlightScripture}</blockquote>
                </figure>
              )}

              {ministry.gatherings?.length ? (
                <div className='rounded-[2rem] border border-border bg-white p-8'>
                  <h2 className='flex items-center gap-2 font-display text-2xl font-semibold text-navy-900'>
                    <CalendarDays className='h-5 w-5 text-gold-500' /> {t('pages.ministries.detail.gather')}
                  </h2>
                  <ul className='mt-5 space-y-4'>
                    {ministry.gatherings.map((gathering) => (
                      <li key={`${gathering.day}-${gathering.time}`} className='border-l-2 border-gold-300 pl-4'>
                        <p className='text-sm font-semibold text-navy-900'>{gathering.day}</p>
                        <p className='text-sm text-gold-700'>{gathering.time}</p>
                        <p className='mt-1 text-sm text-muted-foreground'>{gathering.description}</p>
                      </li>
                    ))}
                  </ul>
                  <p className='mt-5 text-xs text-muted-foreground'>{t('pages.ministries.detail.welcome')}</p>
                </div>
              ) : null}

              {ministry.contact && (
                <div className='rounded-[2rem] bg-parchment p-8'>
                  <h2 className='font-display text-2xl font-semibold text-navy-900'>{t('pages.ministries.detail.connect')}</h2>
                  <p className='mt-3 flex items-center gap-2 text-sm text-navy-800'>
                    <UserRound className='h-4 w-4 text-gold-700' /> {ministry.contact.coordinator}
                  </p>
                  <div className='mt-5 flex flex-col gap-2'>
                    {ministry.contact.email && (
                      <Button asChild size='pill'>
                        <a href={`mailto:${ministry.contact.email}`}>
                          <Mail className='mr-2 h-4 w-4' /> {t('pages.ministries.detail.emailCoordinator')}
                        </a>
                      </Button>
                    )}
                    {ministry.contact.phone && (
                      <Button asChild variant='outline' size='pill'>
                        <a href={`tel:${ministry.contact.phone.replace(/\s/g, '')}`}>
                          <Phone className='mr-2 h-4 w-4' /> {ministry.contact.phone}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {others.length > 0 && (
        <section className='bg-parchment/60'>
          <div className='container'>
            <div className='flex items-end justify-between gap-6'>
              <h2 className='text-4xl'>{t('pages.ministries.detail.others')}</h2>
              <Link href='/ministries' className='hidden items-center gap-1.5 text-sm font-semibold text-navy-900 sm:inline-flex'>
                {t('pages.ministries.detail.viewAll')} <ArrowRight className='h-4 w-4' />
              </Link>
            </div>
            <div className='mt-8 grid gap-6 md:grid-cols-3'>
              {others.map((item) => (
                <Link
                  key={item.id}
                  href={`/ministries/${item.slug}`}
                  className='group overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lift'
                >
                  <div className='relative aspect-[16/9] overflow-hidden'>
                    <SmartImage src={item.heroImage} alt='' fill sizes='33vw' className='object-cover transition-transform duration-700 group-hover:scale-105' />
                  </div>
                  <div className='p-5'>
                    <h3 className='font-display text-xl font-semibold text-navy-900'>{item.title}</h3>
                    <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>{item.shortDescription}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
