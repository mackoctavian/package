import type { Metadata } from 'next'

import GalleryExplorer from '@/app/components/gallery/GalleryExplorer'
import PageHero from '@/app/components/site/PageHero'
import { imagery } from '@/app/data/site'
import { pageMetadata, resolveLocale, type LocaleParams } from '@/i18n/page'
import { getT, setRequestLocale } from '@/i18n/server'
import { getGallery } from '@/lib/gallery/queries'

export const revalidate = 300

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getT(locale)
  return pageMetadata(locale, '/gallery', { title: t('pages.gallery.metaTitle'), description: t('pages.gallery.metaDescription') })
}

export default async function GalleryPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  setRequestLocale(locale)
  const t = await getT(locale)
  const buckets = await getGallery(locale)
  return (
    <main>
      <PageHero eyebrow={t('pages.gallery.eyebrow')} title={t('pages.gallery.title')} image={imagery.candles} description={t('pages.gallery.description')} />
      <section>
        <div className='container'>
          <GalleryExplorer buckets={buckets} />
        </div>
      </section>
    </main>
  )
}
