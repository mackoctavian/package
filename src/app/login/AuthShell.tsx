import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import Logo from '@/app/components/Layout/Header/Logo'
import SmartImage from '@/app/components/site/SmartImage'
import { imagery } from '@/app/data/site'

type AuthShellProps = {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
}

/**
 * Split-screen frame for the staff sign-in pages, in the public site's style:
 * a dark photographic panel with the motto beside an ivory form column.
 */
export default function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className='grid min-h-screen bg-ivory text-navy-900 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]'>
      {/* Photo panel: a short band on phones, a full column from lg up. */}
      <aside className='relative isolate flex flex-col justify-between gap-8 overflow-hidden bg-navy-950 px-4 py-6 sm:px-10 lg:min-h-screen lg:px-14 lg:py-12'>
        <SmartImage src={imagery.heroChapel} alt='' fill priority sizes='(min-width: 1024px) 52vw, 100vw' className='-z-10 object-cover opacity-40' />
        <div className='absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/75 to-navy-950/30' />
        <div aria-hidden className='pointer-events-none absolute -bottom-40 -left-40 -z-10 h-[420px] w-[420px] rounded-full bg-gold-400/15 blur-3xl' />

        <div className='flex items-center justify-between gap-4'>
          <Logo variant='inverse' width={52} height={52} />
          <Link href='/' className='inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm text-navy-100 transition hover:border-gold-300 hover:text-white'>
            <ArrowLeft className='h-4 w-4' /> Back to the website
          </Link>
        </div>

        <div className='max-w-md'>
          <p className='eyebrow text-gold-300'>Divine Mercy Retreat Center</p>
          <p className='mt-3 font-display text-3xl leading-[1.05] text-white lg:mt-5 lg:text-5xl'>“Jesus, I trust in You.”</p>
          <p className='mt-5 hidden text-lg leading-relaxed text-navy-100 lg:block'>
            The staff console for retreats and check-in, giving, Mass intentions, publications and the team that serves our guests.
          </p>
        </div>
      </aside>

      <section className='flex items-center justify-center px-4 !py-12 sm:px-8 lg:!py-16'>
        <div className='w-full max-w-md'>
          <p className='eyebrow'>{eyebrow}</p>
          <h1 className='mt-4 !text-5xl leading-[1.05]'>{title}</h1>
          {description ? <div className='mt-4 text-[15px] leading-relaxed text-navy-600'>{description}</div> : null}
          <div className='mt-8'>{children}</div>
          <p className='mt-10 border-t border-navy-100 pt-6 text-xs leading-relaxed text-navy-400'>
            This area is for DMRC staff and volunteers. Looking for a retreat booking?{' '}
            <Link href='/retreats/check-booking' className='font-medium text-navy-700 underline-offset-4 hover:underline'>
              Manage my booking
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
