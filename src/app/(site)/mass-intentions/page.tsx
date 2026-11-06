import type { Metadata } from 'next'
import { CalendarDays, Clock, HandCoins } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import MassIntentionForm from '@/app/components/giving/MassIntentionForm'
import { imagery } from '@/app/data/site'

export const metadata: Metadata = {
  title: 'Request a Mass intention',
  description:
    'Ask the priests of the Divine Mercy Retreat Center to offer Holy Mass for your loved ones, for thanksgiving, healing or the faithful departed.',
}

const massTimes = [
  { day: 'Monday – Thursday', time: 'Daily Mass · 7:00 AM' },
  { day: 'Friday', time: 'Vigil Mass · 6:00 PM' },
  { day: 'Sunday', time: '8:00 AM & 10:30 AM' },
]

export default function MassIntentionsPage() {
  return (
    <main>
      <section className='relative isolate overflow-hidden bg-navy-950 !py-0'>
        <SmartImage src={imagery.churchInterior} alt='' fill priority sizes='100vw' className='-z-10 object-cover opacity-35' />
        <div className='absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/40' />
        <div className='container py-20 sm:py-24'>
          <p className='eyebrow text-gold-300'>Mass intentions</p>
          <h1 className='mt-4 max-w-3xl text-5xl leading-[1.05] text-white sm:text-6xl'>Place your intention on the altar</h1>
          <p className='mt-5 max-w-xl text-lg text-navy-100'>
            Holy Mass is the greatest prayer of the Church. Ask us to offer it for your loved ones, living or departed.
          </p>
        </div>
      </section>

      <section className='py-14 sm:py-20'>
        <div className='container grid gap-10 lg:grid-cols-12'>
          <div className='lg:col-span-7 lg:order-2'>
            <MassIntentionForm />
          </div>

          <aside className='space-y-6 lg:col-span-5 lg:order-1'>
            <div className='rounded-[2rem] bg-parchment p-8'>
              <h2 className='text-3xl'>What is a Mass intention?</h2>
              <p className='mt-4 leading-relaxed text-navy-700'>
                When a priest offers Mass for a particular intention, the graces of Christ’s sacrifice are applied in a special way to that
                person or need. It is an ancient and beautiful way to pray for those you love.
              </p>
            </div>

            <div className='rounded-[2rem] border border-border bg-white p-8'>
              <h3 className='flex items-center gap-2 font-display text-2xl font-semibold text-navy-900'>
                <Clock className='h-5 w-5 text-gold-500' /> Mass times at DMRC
              </h3>
              <ul className='mt-5 divide-y divide-border'>
                {massTimes.map((item) => (
                  <li key={item.day} className='flex justify-between gap-4 py-3 text-sm'>
                    <span className='text-muted-foreground'>{item.day}</span>
                    <span className='font-medium text-navy-900'>{item.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-1'>
              <div className='flex gap-4 rounded-[2rem] border border-border bg-white p-6'>
                <CalendarDays className='h-6 w-6 shrink-0 text-gold-500' />
                <p className='text-sm leading-relaxed text-navy-700'>
                  We confirm the exact date by email. If your preferred day is full, we offer the next available Mass.
                </p>
              </div>
              <div className='flex gap-4 rounded-[2rem] border border-border bg-white p-6'>
                <HandCoins className='h-6 w-6 shrink-0 text-gold-500' />
                <p className='text-sm leading-relaxed text-navy-700'>
                  There is no fixed price for a Mass. A free-will offering, customarily TZS 10,000, supports the priests and the mission.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
