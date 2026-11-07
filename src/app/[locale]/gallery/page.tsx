import type { Metadata } from 'next'

import GalleryExplorer from '@/app/components/gallery/GalleryExplorer'
import PageHero from '@/app/components/site/PageHero'
import { imagery } from '@/app/data/site'
import { getGallery } from '@/lib/gallery/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Photos, videos, recordings and music from retreats and gatherings at the Divine Mercy Retreat Center.',
}

export default async function GalleryPage() {
  const buckets = await getGallery()
  return (
    <main>
      <PageHero
        eyebrow='Gallery'
        title='Sacred moments and memories'
        image={imagery.candles}
        description='Photos, videos, talks and music from retreats, services and community life at DMRC.'
      />
      <section>
        <div className='container'>
          <GalleryExplorer buckets={buckets} />
        </div>
      </section>
    </main>
  )
}
