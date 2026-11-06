import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Ticket } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import RetreatExplorer from '@/app/components/Retreats/listing/RetreatExplorer'
import { imagery } from '@/app/data/site'
import { getAllRetreats, toListItems } from '@/lib/retreats/queries'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Retreats',
  description: 'Browse upcoming residential, parish and special retreats at the Divine Mercy Retreat Center and reserve your place online.',
}

export default async function RetreatsPage() {
  const { retreats } = await getAllRetreats()
  const items = toListItems(retreats)

  return (
    <main>
      <section className='relative isolate overflow-hidden bg-navy-950 !py-0'>
        <SmartImage src={imagery.sunriseHills} alt='' fill priority sizes='100vw' className='-z-10 object-cover opacity-35' />
        <div className='absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/40' />
        <div className='container flex flex-col gap-8 py-20 sm:py-24 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl'>
            <p className='eyebrow text-gold-300'>Retreats at DMRC</p>
            <h1 className='mt-4 text-5xl leading-[1.05] text-white sm:text-6xl'>Set apart time to meet the Lord</h1>
            <p className='mt-5 text-lg text-navy-100'>
              Choose a retreat, register in a few minutes and receive a QR-code ticket by email.
            </p>
          </div>
          <Link
            href='/retreats/check-booking'
            className='inline-flex w-fit items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10'
          >
            <Ticket className='h-4 w-4 text-gold-300' /> Already booked? Manage your booking
          </Link>
        </div>
      </section>

      <section className='py-10 sm:py-14'>
        <div className='container'>
          <Suspense>
            <RetreatExplorer retreats={items} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
