import type { Metadata } from 'next'
import { Link } from '@/i18n/link'
import { getT, setRequestLocale } from '@/i18n/server'
import { pageMetadata, resolveLocale, type LocaleParams } from '@/i18n/page'
import { ArrowRight, Church, HandHeart, MessagesSquare, Users } from 'lucide-react'

import PageHero from '@/app/components/site/PageHero'
import { imagery } from '@/app/data/site'

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getT(locale)
  return pageMetadata(locale, '/apostolate', { title: t('apostolate.metaTitle'), description: t('apostolate.metaDescription') })
}

const sections = [
  { id: 'mass', icon: Church, links: ['/mass-intentions', '/donation'] },
  { id: 'ministries', icon: Users, links: ['/ministries', '/ministries/spiritual-partners'] },
  { id: 'saturday', icon: HandHeart, links: ['/ministries/saturday-service', '/retreats'] },
  { id: 'counselling', icon: MessagesSquare, links: ['/ministries/spiritual-counselling', '/#contact'] },
] as const

export default async function ApostolatePage({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  setRequestLocale(locale)
  const t = await getT(locale)
  return (
    <main>
      <PageHero
        eyebrow={t('apostolate.eyebrow')}
        title={t('apostolate.title')}
        image={imagery.churchInterior}
        description={t('apostolate.description')}
      />
      <section>
        <div className='container grid gap-6 md:grid-cols-2'>
          {sections.map((section) => (
            <article key={section.id} className='flex flex-col rounded-[2rem] border border-border bg-white p-8 shadow-soft'>
              <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-parchment text-gold-700'>
                <section.icon className='h-6 w-6' />
              </span>
              <h2 className='mt-5 text-3xl'>{t(`apostolate.sections.${section.id}.title`)}</h2>
              <p className='mt-3 flex-1 leading-relaxed text-muted-foreground'>{t(`apostolate.sections.${section.id}.description`)}</p>
              <div className='mt-6 flex flex-wrap gap-x-6 gap-y-2'>
                {section.links.map((href, index) => (
                  <Link key={href} href={href} className='group inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900'>
                    {t(`apostolate.sections.${section.id}.${index === 0 ? 'primary' : 'secondary'}`)}{' '}
                    <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
