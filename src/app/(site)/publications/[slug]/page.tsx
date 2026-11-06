import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, Store, Truck } from 'lucide-react'

import { AddToCartButton, BookshopProvider } from '@/app/components/publications/Bookshop'
import PublicationCard from '@/app/components/publications/PublicationCard'
import SmartImage from '@/app/components/site/SmartImage'
import { DELIVERY_FEE, formatTZS } from '@/lib/publications/format'
import { getPublicationBySlug, getPublications } from '@/lib/publications/queries'

export const revalidate = 300

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicationBySlug(slug)
  if (!result) return { title: 'Publication not found' }
  const { publication } = result
  return { title: publication.title, description: publication.description.slice(0, 160), openGraph: { images: [publication.coverImage] } }
}

export default async function PublicationDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [result, catalogue] = await Promise.all([getPublicationBySlug(slug), getPublications()])
  if (!result) notFound()
  const { publication, related } = result
  const saving = publication.originalPrice && publication.originalPrice > publication.price ? publication.originalPrice - publication.price : 0

  return (
    <BookshopProvider catalogue={catalogue}>
      <main>
        <section className='bg-ivory'>
          <div className='container'>
            <Link href='/publications' className='inline-flex items-center gap-2 text-sm font-medium text-gold-700 hover:text-gold-600'>
              <ArrowLeft className='h-4 w-4' /> All publications
            </Link>
            <div className='mt-8 grid gap-12 lg:grid-cols-12'>
              <div className='lg:col-span-5'>
                <div className='relative mx-auto aspect-[3/4] max-w-md overflow-hidden rounded-[2rem] bg-parchment shadow-lift'>
                  <SmartImage src={publication.coverImage} alt={publication.title} fill priority sizes='(min-width: 1024px) 40vw, 100vw' className='object-cover' />
                </div>
              </div>
              <div className='lg:col-span-7'>
                <p className='eyebrow'>
                  {publication.category} · {publication.format}
                </p>
                <h1 className='mt-3 text-5xl leading-[1.05] sm:text-6xl'>{publication.title}</h1>
                {publication.subtitle && <p className='mt-3 text-xl text-navy-700'>{publication.subtitle}</p>}
                <p className='mt-4 text-muted-foreground'>by {publication.author}</p>

                <div className='mt-8 flex items-baseline gap-3'>
                  <span className='font-display text-4xl font-semibold text-navy-900'>{formatTZS(publication.price)}</span>
                  {saving > 0 && (
                    <>
                      <span className='text-lg text-muted-foreground line-through'>{formatTZS(publication.originalPrice!)}</span>
                      <span className='rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>Save {formatTZS(saving)}</span>
                    </>
                  )}
                </div>
                <p className='mt-2 text-sm'>
                  {publication.inStock === false ? (
                    <span className='text-red-600'>Currently out of stock</span>
                  ) : (
                    <span className='text-emerald-700'>In stock at the DMRC bookshop</span>
                  )}
                </p>

                <AddToCartButton publication={publication} size='xl' className='mt-8 w-full sm:w-auto' />

                <div className='mt-10 border-t border-border pt-8'>
                  <h2 className='font-sans text-lg font-semibold text-navy-900'>About this item</h2>
                  <p className='mt-3 whitespace-pre-line leading-relaxed text-navy-800'>{publication.description}</p>
                </div>

                <ul className='mt-8 grid gap-4 sm:grid-cols-3'>
                  <li className='rounded-2xl bg-white p-4 text-sm'>
                    <Store className='h-5 w-5 text-gold-600' />
                    <p className='mt-2 font-semibold text-navy-900'>Collect at DMRC</p>
                    <p className='text-muted-foreground'>Free</p>
                  </li>
                  <li className='rounded-2xl bg-white p-4 text-sm'>
                    <Truck className='h-5 w-5 text-gold-600' />
                    <p className='mt-2 font-semibold text-navy-900'>Delivery in Dar</p>
                    <p className='text-muted-foreground'>{formatTZS(DELIVERY_FEE)}</p>
                  </li>
                  <li className='rounded-2xl bg-white p-4 text-sm'>
                    <BookOpen className='h-5 w-5 text-gold-600' />
                    <p className='mt-2 font-semibold text-navy-900'>Published</p>
                    <p className='text-muted-foreground'>{new Date(publication.publishedOn).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section>
            <div className='container'>
              <h2 className='text-4xl'>You may also like</h2>
              <div className='mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4'>
                {related.map((item) => (
                  <PublicationCard key={item.id} publication={item} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </BookshopProvider>
  )
}
