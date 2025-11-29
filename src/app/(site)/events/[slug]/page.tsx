import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { retreatData } from '@/app/data/retreats'
import RetreatBookingForm from '@/app/components/Retreats/RetreatBookingForm'
import prisma from '@/lib/prisma'
import { mapPrismaRetreat } from '@/app/api/retreats/utils'
import type { RetreatType } from '@/app/types/retreat'

type PageProps = {
  params: { slug: string }
}

const loadRetreat = async (slug: string): Promise<RetreatType | undefined> => {
  try {
    const record = await prisma.retreat.findUnique({
      where: { slug },
    })
    if (record) {
      return mapPrismaRetreat(record)
    }
  } catch (error) {
    console.error('[events][slug] prisma load failed:', error)
  }

  return retreatData.find((item) => item.slug === slug)
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const retreat = await loadRetreat(params.slug)

  if (!retreat) {
    return {
      title: 'Retreat Not Found',
    }
  }

  return {
    title: `${retreat.title} | Retreat Booking`,
    description: retreat.description,
  }
}

const RetreatDetailPage = async ({ params }: PageProps) => {
  const retreat = await loadRetreat(params.slug)

  if (!retreat) {
    notFound()
  }

  return (
    <main className='bg-white'>
      <section className='relative overflow-hidden bg-gradient-to-br from-primary via-purple-600 to-indigo-500 pt-32 pb-20 text-white'>
        <div className='container mx-auto max-w-5xl px-4'>
          <div className='relative overflow-hidden rounded-3xl border border-white/30 bg-white/10 px-6 py-8 backdrop-blur-lg shadow-2xl sm:px-10 sm:py-12'>
            <div className='flex flex-col gap-6'>
              <div>
                <p className='text-sm font-medium uppercase tracking-[4px] text-white/70'>
                  Conducted by {retreat.conductor}
                </p>
                <h1 className='mt-3 text-4xl font-bold sm:text-5xl'>{retreat.subtitle ?? retreat.title}</h1>
                {retreat.subtitle && (
                  <p className='mt-2 text-lg font-semibold text-white/80'>{retreat.title}</p>
                )}
              </div>

              <p className='max-w-3xl text-base leading-relaxed text-white/90'>{retreat.description}</p>

              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/10 p-4'>
                  <span className='flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/70'>
                    <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg'>
                      📅
                    </span>
                    Retreat Dates
                  </span>
                  <span className='text-base font-semibold text-white'>{retreat.dateRange}</span>
                </div>
                <div className='flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/10 p-4'>
                  <span className='flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/70'>
                    <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg'>
                      ⏰
                    </span>
                    Time
                  </span>
                  <span className='text-base font-semibold text-white'>{retreat.timeRange}</span>
                </div>
                <div className='flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/10 p-4'>
                  <span className='flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/70'>
                    <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg'>
                      👥
                    </span>
                    Available Seats
                  </span>
                  <span className='text-base font-semibold text-white'>
                    Male: {retreat.availability.male} &nbsp;•&nbsp; Female: {retreat.availability.female}
                  </span>
                </div>
                <div className='flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/10 p-4'>
                  <span className='flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/70'>
                    <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg'>
                      ✅
                    </span>
                    Status
                  </span>
                  <span className='inline-flex w-fit items-center gap-2 rounded-full bg-white/90 px-4 py-1 text-sm font-semibold text-primary shadow'>
                    {retreat.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='py-16 sm:py-20 bg-gray-50'>
        <div className='container mx-auto max-w-5xl px-4'>
          <RetreatBookingForm retreat={retreat} />
        </div>
      </section>
    </main>
  )
}

export default RetreatDetailPage



