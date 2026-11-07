import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BookOpen, Store, Truck } from 'lucide-react'

import { BookshopProvider } from '@/app/components/publications/Bookshop'
import PublicationShop from '@/app/components/publications/PublicationShop'
import PageHero from '@/app/components/site/PageHero'
import { imagery } from '@/app/data/site'
import { DELIVERY_FEE, formatTZS } from '@/lib/publications/format'
import { getPublications } from '@/lib/publications/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Publications',
  description: 'Bibles, spiritual books, worship CDs and Catholic calendars from the Divine Mercy Retreat Center bookshop.',
}

const perks = [
  { icon: Store, title: 'Collect at DMRC', text: 'Pick up your order at the retreat centre bookshop.' },
  { icon: Truck, title: 'Delivery in Dar es Salaam', text: `Flat ${formatTZS(DELIVERY_FEE)} per order.` },
  { icon: BookOpen, title: 'English and Kiswahili', text: 'Bibles and reading for every member of the family.' },
]

export default async function PublicationsPage() {
  const publications = await getPublications()
  return (
    <BookshopProvider catalogue={publications}>
      <main>
        <PageHero
          eyebrow='Publications'
          title='Nourish your faith at home'
          image={imagery.bibleReading}
          description='Bibles, spiritual reading, worship music and calendars from the DMRC bookshop.'
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
