import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mic2, UserRound } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import BookingWizard, { RetreatFactsCard } from '@/app/components/Retreats/booking/BookingWizard'
import { getRetreatBySlug } from '@/lib/retreats/queries'
import { parseRetreatDates } from '@/lib/retreats/dates'

type PageProps = {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params
  const retreat = await getRetreatBySlug(slug)
  if (!retreat) return { title: 'Retreat not found' }
  return {
    title: `${retreat.title} · Book your place`,
    description: retreat.description,
    openGraph: { title: retreat.title, description: retreat.description, images: retreat.imageSrc ? [retreat.imageSrc] : undefined },
  }
}

export default async function RetreatDetailPage({ params }: PageProps) {
  const { slug } = await params
  const retreat = await getRetreatBySlug(slug)
  if (!retreat) notFound()

  const { start, end } = parseRetreatDates(retreat.dateRange)
  const ended = end ? end.getTime() < new Date().setHours(0, 0, 0, 0) : false

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: retreat.title,
    description: retreat.description,
    image: retreat.imageSrc,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    startDate: start?.toISOString(),
    endDate: end?.toISOString(),
    location: { '@type': 'Place', name: retreat.location, address: 'Vikindu, Tanzania' },
    performer: { '@type': 'Person', name: retreat.speaker },
    organizer: { '@type': 'Organization', name: 'Divine Mercy Retreat Center' },
  }

  return (
    <main>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className='relative isolate overflow-hidden bg-navy-950 !py-0'>
        <SmartImage src={retreat.imageSrc} alt='' fill priority sizes='100vw' className='-z-10 object-cover opacity-40' />
        <div className='absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/30' />
        <div className='container pb-16 pt-10 sm:pb-20'>
          <Link href='/retreats' className='inline-flex items-center gap-1.5 text-sm text-navy-200 hover:text-white'>
            <ArrowLeft className='h-4 w-4' /> All retreats
          </Link>
          <div className='mt-12 max-w-3xl'>
            <p className='eyebrow text-gold-300'>{retreat.dateRange}</p>
            <h1 className='mt-4 text-5xl leading-[1.05] text-white sm:text-6xl'>{retreat.title}</h1>
            {retreat.subtitle && retreat.subtitle !== retreat.title && (
              <p className='mt-4 font-display text-2xl italic text-gold-200'>{retreat.subtitle}</p>
            )}
            <div className='mt-8 flex flex-wrap gap-x-8 gap-y-3 text-navy-100'>
              <span className='inline-flex items-center gap-2'>
                <Mic2 className='h-4 w-4 text-gold-300' /> Preacher: {retreat.speaker}
              </span>
              {retreat.conductor && retreat.conductor !== retreat.speaker && (
                <span className='inline-flex items-center gap-2'>
                  <UserRound className='h-4 w-4 text-gold-300' /> Conducted by {retreat.conductor}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className='py-14 sm:py-20'>
        <div className='container grid gap-10 lg:grid-cols-12'>
          <div className='space-y-10 lg:col-span-8'>
            <div>
              <h2 className='text-3xl sm:text-4xl'>About this retreat</h2>
              <p className='mt-4 whitespace-pre-line text-lg leading-relaxed text-navy-700'>{retreat.description}</p>
            </div>
            <div className='lg:hidden'>
              <RetreatFactsCard retreat={retreat} ended={ended} />
            </div>
            <BookingWizard retreat={retreat} ended={ended} />
          </div>
          <aside className='hidden lg:col-span-4 lg:block'>
            <div className='sticky top-28'>
              <RetreatFactsCard retreat={retreat} ended={ended} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
