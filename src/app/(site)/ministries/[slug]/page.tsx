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
        <div className='relative container mx-auto py-32 text-center text-white space-y-6'>
          <p className='text-xs font-semibold uppercase tracking-[0.4em] text-white/70'>DMRC Ministry</p>
          <h1 className='text-4xl sm:text-5xl font-bold leading-tight'>{ministry.title}</h1>
          <p className='text-base sm:text-lg text-white/80'>{ministry.shortDescription}</p>
          {ministry.highlightScripture ? (
            <p className='text-sm italic text-white/80'>{ministry.highlightScripture}</p>
          ) : null}
        </div>
      </section>

      <section className='py-16 sm:py-20 bg-gray-50'>
        <div className='container mx-auto space-y-16'>
          {/* Overview Section */}
          <div className='space-y-6'>
            <h2 className='text-3xl font-semibold text-slate-900'>Overview</h2>
            <p className='text-lg leading-7 text-slate-700'>{ministry.overview}</p>
          </div>

          {/* Focus Areas Section */}
          {ministry.focusAreas && ministry.focusAreas.length > 0 && (
            <div className='space-y-6'>
              <h2 className='text-3xl font-semibold text-slate-900'>Focus Areas</h2>
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {ministry.focusAreas.map((area) => (
                  <div
                    key={area.title}
                    className='h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md'>
                    <h3 className='text-lg font-semibold text-slate-900'>{area.title}</h3>
                    <p className='mt-3 text-sm leading-6 text-slate-600'>{area.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gatherings & Rhythm Section */}
          {ministry.gatherings && ministry.gatherings.length > 0 && (
            <div className='space-y-6'>
              <div className='text-center space-y-2 mb-8'>
                <h2 className='text-3xl font-semibold text-slate-900'>Gatherings & Rhythm</h2>
                <p className='text-base text-slate-600 max-w-2xl mx-auto'>
                  Join us for weekly formation, intercession, and mission opportunities. New participants are welcome at
                  any public gathering listed here.
                </p>
              </div>
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {ministry.gatherings.map((gathering) => (
                  <div
                    key={`${gathering.day}-${gathering.time}`}
                    className='rounded-2xl border border-primary/20 bg-white p-6 shadow-sm transition hover:shadow-md'>
                    <p className='text-sm font-semibold uppercase tracking-[0.3em] text-primary/80 mb-2'>{gathering.day}</p>
                    <p className='text-base font-semibold text-slate-900 mb-2'>{gathering.time}</p>
                    <p className='text-sm text-slate-600'>{gathering.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities Showcase Section */}
          {ministry.activities && ministry.activities.length > 0 && (
            <div className='space-y-8'>
              <div className='text-center space-y-2'>
                <h2 className='text-3xl font-semibold text-slate-900'>Ministry Activities</h2>
                <p className='text-base text-slate-600 max-w-2xl mx-auto'>
                  Explore the vibrant activities and events happening within this ministry.
                </p>
              </div>
              <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
                {ministry.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className='group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg'>
                    <div className='relative h-64 w-full overflow-hidden'>
                      <Image
                        src={activity.image}
                        alt={activity.title}
                        fill
                        className='object-cover object-center transition duration-500 group-hover:scale-110'
                        sizes='(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'
                      />
                    </div>
                    <div className='p-6 space-y-3'>
                      {activity.date && (
                        <p className='text-xs font-semibold uppercase tracking-wider text-primary/70'>
                          {new Date(activity.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                      <h3 className='text-xl font-semibold text-slate-900'>{activity.title}</h3>
                      <p className='text-sm leading-6 text-slate-600'>{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Section */}
          {ministry.contact && (
            <div className='rounded-3xl border border-primary/20 bg-gradient-to-br from-primary to-primary/80 p-8 text-white shadow-lg'>
              <div className='max-w-2xl mx-auto text-center space-y-4'>
                <h2 className='text-2xl font-semibold'>Connect with Us</h2>
                <p className='text-white/90'>
                  Reach out to {ministry.contact.coordinator} for serving opportunities, prayer requests, or next steps.
                </p>
                <div className='flex flex-col sm:flex-row items-center justify-center gap-6 pt-4'>
                  <a
                    href={`mailto:${ministry.contact.email}`}
                    className='flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                    </svg>
                    {ministry.contact.email}
                  </a>
                  {ministry.contact.phone && (
                    <a
                      href={`tel:${ministry.contact.phone}`}
                      className='flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors'>
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                      </svg>
                      {ministry.contact.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default MinistryDetailPage
