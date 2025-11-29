import Image from 'next/image'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ministriesData } from '@/app/data/ministries'

type MinistryRouteProps = {
  params: {
    slug: string
  }
}

export const generateStaticParams = () => {
  return ministriesData.map((ministry) => ({
    slug: ministry.slug,
  }))
}

export const generateMetadata = ({ params }: MinistryRouteProps): Metadata => {
  const ministry = ministriesData.find((item) => item.slug === params.slug)

  if (!ministry) {
    return {
      title: 'Ministry Not Found',
    }
  }

  return {
    title: `${ministry.title} | Divine Mercy Retreat Center`,
    description: ministry.shortDescription,
  }
}

const MinistryDetailPage = ({ params }: MinistryRouteProps) => {
  const ministry = ministriesData.find((item) => item.slug === params.slug)

  if (!ministry) {
    notFound()
  }

  return (
    <main>
      <section className='relative overflow-hidden'>
        <div className='absolute inset-0'>
          <Image
            src={ministry.heroImage}
            alt={ministry.title}
            fill
            className='object-cover object-center brightness-75'
            sizes='100vw'
            priority
          />
          <div className='absolute inset-0 bg-primary/80 mix-blend-multiply' />
        </div>
        <div className='relative container mx-auto max-w-4xl px-4 py-32 text-center text-white space-y-6'>
          <p className='text-xs font-semibold uppercase tracking-[0.4em] text-white/70'>DMRC Ministry</p>
          <h1 className='text-4xl sm:text-5xl font-bold leading-tight'>{ministry.title}</h1>
          <p className='text-base sm:text-lg text-white/80'>{ministry.shortDescription}</p>
          {ministry.highlightScripture ? (
            <p className='text-sm italic text-white/80'>{ministry.highlightScripture}</p>
          ) : null}
        </div>
      </section>

      <section className='py-16 sm:py-20 bg-gray-50'>
        <div className='container mx-auto max-w-6xl px-4 space-y-16'>
          <div className='grid gap-12 lg:grid-cols-3'>
            <div className='lg:col-span-2 space-y-6'>
              <h2 className='text-3xl font-semibold text-slate-900'>Overview</h2>
              <p className='text-lg leading-7 text-slate-700'>{ministry.overview}</p>

              <div className='space-y-4'>
                <h3 className='text-2xl font-semibold text-slate-900'>Focus Areas</h3>
                <div className='grid gap-6 md:grid-cols-2'>
                  {ministry.focusAreas.map((area) => (
                    <div
                      key={area.title}
                      className='h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md'>
                      <h4 className='text-lg font-semibold text-slate-900'>{area.title}</h4>
                      <p className='mt-3 text-sm leading-6 text-slate-600'>{area.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className='space-y-6 rounded-3xl border border-primary/20 bg-white p-8 shadow-[0_18px_44px_rgba(59,130,246,0.1)]'>
              <div className='space-y-2'>
                <h3 className='text-xl font-semibold text-slate-900'>Gatherings & Rhythm</h3>
                <p className='text-sm text-slate-600'>
                  Join us for weekly formation, intercession, and mission opportunities. New participants are welcome at
                  any public gathering listed here.
                </p>
              </div>
              <ul className='space-y-4'>
                {ministry.gatherings.map((gathering) => (
                  <li key={`${gathering.day}-${gathering.time}`} className='rounded-2xl bg-primary/5 p-4'>
                    <p className='text-sm font-semibold uppercase tracking-[0.3em] text-primary/80'>{gathering.day}</p>
                    <p className='text-base font-semibold text-slate-900'>{gathering.time}</p>
                    <p className='text-sm text-slate-600'>{gathering.description}</p>
                  </li>
                ))}
              </ul>
              <div className='space-y-3 rounded-2xl bg-primary text-white p-5'>
                <h4 className='text-lg font-semibold'>Connect with Us</h4>
                <p className='text-sm text-white/80'>
                  Reach out to {ministry.contact.coordinator} for serving opportunities, prayer requests, or next steps.
                </p>
                <div className='space-y-1 text-sm font-medium'>
                  <p>Email: <a href={`mailto:${ministry.contact.email}`} className='underline underline-offset-4'>{ministry.contact.email}</a></p>
                  {ministry.contact.phone ? (
                    <p>Phone: <a href={`tel:${ministry.contact.phone}`} className='underline underline-offset-4'>{ministry.contact.phone}</a></p>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

export default MinistryDetailPage

