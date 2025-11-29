import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'

import { ministriesData } from '@/app/data/ministries'

export const metadata: Metadata = {
  title: 'Ministries | Divine Mercy Retreat Center',
  description:
    'Explore the ministries of Divine Mercy Retreat Center and find community, formation, and mission opportunities that match your calling.',
}

const MinistriesPage = () => {
  return (
    <main>
      <section className='pt-32 pb-16 bg-primary/10'>
        <div className='container mx-auto max-w-4xl px-4 text-center space-y-4'>
          <p className='text-sm font-semibold tracking-wide uppercase text-primary'>DMRC Ministries</p>
          <h1 className='text-4xl sm:text-5xl font-bold text-gray-900'>Serve, Encounter, and Go Forth</h1>
          <p className='text-base sm:text-lg text-gray-600'>
            Discover the communities, outreach teams, and formation tracks that carry the mercy message across
            parishes, families, and mission fields. Each ministry has dedicated coordinators ready to help you take
            your next step.
          </p>
        </div>
      </section>

      <section className='py-16 sm:py-20 bg-gray-50'>
        <div className='container mx-auto max-w-7xl px-4'>
          <div className='grid gap-8 sm:grid-cols-2 xl:grid-cols-3'>
            {ministriesData.map((ministry) => (
              <article
                key={ministry.id}
                className='group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-2 hover:shadow-[0_28px_80px_rgba(15,23,42,0.1)]'>
                <div className='relative h-56 w-full overflow-hidden bg-slate-100'>
                  <Image
                    src={ministry.heroImage}
                    alt={ministry.title}
                    fill
                    className='object-cover object-center transition duration-500 group-hover:scale-105'
                    sizes='(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw'
                    priority={false}
                  />
                </div>
                <div className='flex flex-1 flex-col gap-4 p-8'>
                  <div className='space-y-2'>
                    <p className='text-xs font-semibold uppercase tracking-[0.35em] text-primary/80'>DMRC Ministry</p>
                    <h2 className='text-2xl font-semibold text-slate-900'>{ministry.title}</h2>
                  </div>
                  <p className='text-sm leading-6 text-slate-600 flex-1'>{ministry.shortDescription}</p>
                  <div className='flex items-center justify-between pt-4'>
                    <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary'>
                      <span>Focus Areas</span>
                      <span className='rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary/90'>
                        {ministry.focusAreas.length}
                      </span>
                    </div>
                    <Link
                      href={`/ministries/${ministry.slug}`}
                      className='inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/80'>
                      View Ministry
                      <span aria-hidden='true' className='transition-transform group-hover:translate-x-1'>
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default MinistriesPage

