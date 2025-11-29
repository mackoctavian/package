'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icon } from '@iconify/react/dist/iconify.js'
import { publicationsData } from '@/app/data/publications'
import type { PublicationCategory, PublicationType } from '@/app/types/publication'

type PageProps = {
  params: { slug: string }
}

const formatter = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

const categoryColor: Record<PublicationCategory, string> = {
  Books: 'bg-rose-100 text-rose-700 border-rose-200',
  'Study Guides': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Devotional: 'bg-amber-100 text-amber-700 border-amber-200',
  Music: 'bg-sky-100 text-sky-700 border-sky-200',
  Video: 'bg-violet-100 text-violet-700 border-violet-200',
}

const formatColor: Record<PublicationType['format'], string> = {
  Hardcover: 'bg-sky-100 text-sky-700 border-sky-200',
  Paperback: 'bg-stone-100 text-stone-700 border-stone-200',
  Digital: 'bg-purple-100 text-purple-700 border-purple-200',
  Audio: 'bg-teal-100 text-teal-700 border-teal-200',
  Video: 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

const PublicationDetailPage = ({ params }: PageProps) => {
  const publication = publicationsData.find(
    (item) => item.title.toLowerCase().replace(/\s+/g, '-') === params.slug,
  )

  if (!publication) {
    notFound()
  }

  const [selectedPreview, setSelectedPreview] = useState<'cover' | 'gallery' | 'video'>('cover')

  const relatedItems = useMemo(() => {
    return publicationsData
      .filter((item) => item.id !== publication.id && item.category === publication.category)
      .slice(0, 3)
  }, [publication])

  return (
    <main className='bg-gray-50 min-h-screen'>
      <section className='relative overflow-hidden bg-gradient-to-br from-primary via-indigo-600 to-slate-900 pt-28 pb-16 text-white'>
        <div className='absolute inset-0 opacity-25 mix-blend-screen'>
          <div className='absolute -right-24 top-16 h-80 w-80 rounded-full bg-white/10 blur-3xl' />
          <div className='absolute -left-16 bottom-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl' />
        </div>
        <div className='container mx-auto max-w-6xl px-4'>
          <div className='flex flex-col gap-6'>
            <Link
              href='/publications'
              className='inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20'>
              <Icon icon='solar:arrow-left-linear' className='text-lg' />
              Back to Publications
            </Link>
            <div className='flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide'>
              <span className={`rounded-full border px-3 py-1 ${categoryColor[publication.category]}`}>
                {publication.category}
              </span>
              <span className={`rounded-full border px-3 py-1 ${formatColor[publication.format]}`}>
                {publication.format}
              </span>
              {publication.badge && (
                <span className='rounded-full border border-white/40 bg-white/10 px-3 py-1 text-white/80'>
                  {publication.badge}
                </span>
              )}
            </div>
            <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>{publication.title}</h1>
            {publication.subtitle && (
              <p className='text-lg font-semibold text-white/80'>{publication.subtitle}</p>
            )}
            <div className='flex flex-wrap items-center gap-4 text-sm text-white/80'>
              <span className='inline-flex items-center gap-2'>
                <Icon icon='solar:pen-bold-duotone' className='text-lg text-white' />
                {publication.author}
              </span>
              <span className='inline-flex items-center gap-2'>
                <Icon icon='solar:star-bold' className='text-lg text-amber-400' />
                {publication.rating.toFixed(1)} ({publication.totalReviews} reviews)
              </span>
              <span className='inline-flex items-center gap-2'>
                <Icon icon='solar:calendar-bold-duotone' className='text-lg text-white' />
                Published {new Date(publication.publishedOn).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className='-mt-12 pb-24'>
        <div className='container mx-auto max-w-6xl px-4'>
          <div className='grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)]'>
            <div className='rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5'>
              <div className='relative overflow-hidden rounded-2xl bg-gray-100'>
                {selectedPreview === 'cover' && (
                  <Image
                    src={publication.coverImage}
                    alt={publication.title}
                    width={900}
                    height={700}
                    className='h-full w-full object-cover'
                  />
                )}
                {selectedPreview === 'gallery' && (
                  <div className='grid gap-4 p-4 sm:grid-cols-2'>
                    {[...Array(4)].map((_, index) => (
                      <div
                        key={index}
                        className='flex h-36 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-100 text-sm font-medium text-gray-500'>
                        Media Placeholder #{index + 1}
                      </div>
                    ))}
                  </div>
                )}
                {selectedPreview === 'video' && (
                  <div className='flex h-64 items-center justify-center rounded-2xl bg-black/80 text-sm font-semibold text-white'>
                    Video preview player placeholder
                  </div>
                )}
                <div className='absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 rounded-full bg-white/80 px-4 py-2 shadow-lg'>
                  <button
                    onClick={() => setSelectedPreview('cover')}
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      selectedPreview === 'cover'
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    <Icon icon='solar:image-bold-duotone' className='text-sm' />
                    Cover
                  </button>
                  <button
                    onClick={() => setSelectedPreview('gallery')}
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      selectedPreview === 'gallery'
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    <Icon icon='solar:gallery-wide-bold-duotone' className='text-sm' />
                    Gallery
                  </button>
                  <button
                    onClick={() => setSelectedPreview('video')}
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      selectedPreview === 'video'
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    <Icon icon='solar:play-circle-bold-duotone' className='text-sm' />
                    Video
                  </button>
                </div>
              </div>

              <div className='mt-6 space-y-4 text-sm text-gray-600'>
                <p>{publication.description}</p>
                <div className='rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3'>
                  <h3 className='text-sm font-semibold text-gray-900'>Highlights</h3>
                  <ul className='mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2'>
                    <li className='flex items-center gap-2'>
                      <Icon icon='solar:document-text-bold-duotone' className='text-primary' />
                      Includes guided reflection prompts
                    </li>
                    <li className='flex items-center gap-2'>
                      <Icon icon='solar:clock-circle-bold-duotone' className='text-primary' />
                      Designed for 6-week companion journey
                    </li>
                    <li className='flex items-center gap-2'>
                      <Icon icon='solar:users-group-rounded-bold-duotone' className='text-primary' />
                      Ideal for small group facilitation
                    </li>
                    <li className='flex items-center gap-2'>
                      <Icon icon='solar:bookmark-bold-duotone' className='text-primary' />
                      Includes downloadable resource kit
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-6'>
              <div className='rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5'>
                <div className='space-y-4'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='text-sm font-semibold uppercase tracking-wide text-primary'>Your Selection</p>
                      <h2 className='text-3xl font-bold text-gray-900'>{formatter.format(publication.price)}</h2>
                      <p className='text-sm text-gray-500'>Format: {publication.format}</p>
                    </div>
                    <div className='rounded-full border border-white/60 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary'>
                      {publication.rating.toFixed(1)} rating
                    </div>
                  </div>

                  <div className='grid gap-3 text-sm font-medium text-gray-600'>
                    <div className='flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3'>
                      <Icon icon='solar:download-bold-duotone' className='text-lg text-primary' />
                      Instant download or shipping within 48 hours
                    </div>
                    <div className='flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3'>
                      <Icon icon='solar:shield-check-bold-duotone' className='text-lg text-primary' />
                      Secure online checkout powered by Stripe
                    </div>
                    <div className='flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3'>
                      <Icon icon='solar:gift-bold-duotone' className='text-lg text-primary' />
                      Complimentary ministry resource bundle included
                    </div>
                  </div>

                  <div className='flex flex-col gap-3'>
                    <button className='inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90'>
                      <Icon icon='solar:cart-3-bold-duotone' className='text-lg' />
                      Add to Cart
                    </button>
                    <button className='inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10'>
                      <Icon icon='solar:bookmark-square-bold-duotone' className='text-lg' />
                      Save to Wishlist
                    </button>
                    <button className='inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary'>
                      <Icon icon='solar:share-bold-duotone' className='text-lg' />
                      Share with a Friend
                    </button>
                  </div>
                </div>
              </div>

              <div className='rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5'>
                <h3 className='text-lg font-semibold text-gray-900'>About the Author</h3>
                <div className='mt-4 flex gap-3 text-sm text-gray-600'>
                  <Icon icon='solar:user-rounded-bold-duotone' className='text-2xl text-primary' />
                  <p>
                    {publication.author} serves within the retreat centre&apos;s teaching ministry and brings years of
                    pastoral experience to every resource. Their publications emphasise encounter, discipleship, and
                    practical application for individuals and parish teams.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {relatedItems.length > 0 && (
            <section className='mt-16 space-y-6'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-900'>You may also enjoy</h3>
                <Link
                  href='/publications'
                  className='inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline'>
                  Browse all resources
                  <Icon icon='solar:arrow-right-bold-duotone' className='text-base' />
                </Link>
              </div>
              <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                {relatedItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/publications/${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className='group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl'>
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      width={480}
                      height={320}
                      className='h-40 w-full object-cover transition duration-500 group-hover:scale-105'
                    />
                    <div className='flex flex-1 flex-col gap-2 p-4'>
                      <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary'>
                        <span>{item.category}</span>
                        <span className='h-1 w-1 rounded-full bg-primary/40' />
                        <span>{item.format}</span>
                      </div>
                      <h4 className='text-base font-semibold text-gray-900 group-hover:text-primary'>
                        {item.title}
                      </h4>
                      <p className='text-sm text-gray-600'>{item.author}</p>
                      <div className='mt-auto flex items-center justify-between text-sm font-semibold text-gray-900'>
                        {formatter.format(item.price)}
                        <span className='inline-flex items-center gap-1 text-xs text-amber-500'>
                          <Icon icon='solar:star-bold' />
                          {item.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

export default PublicationDetailPage



