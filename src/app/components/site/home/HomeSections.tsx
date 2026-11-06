import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarCheck, Church, ClipboardCheck, Flame, HandHeart, HeartHandshake, QrCode, Quote } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import SectionHeading from '@/app/components/site/SectionHeading'
import RetreatCard from '@/app/components/site/RetreatCard'
import { Button } from '@/app/components/ui/button'
import { imagery } from '@/app/data/site'
import type { GalleryPreviewItem, HomepageRetreat, PatronView, TestimonialView } from '@/lib/site/homepage'

/* ----------------------------------------------------------------------------
 * Welcome
 * ------------------------------------------------------------------------- */

const offerings = [
  { icon: Church, title: 'Holy Mass & Adoration', text: 'The Eucharist at the heart of every day of retreat.' },
  { icon: HandHeart, title: 'Healing & counselling', text: 'Confession, intercession and spiritual direction.' },
  { icon: BookOpen, title: 'Preached retreats', text: 'Word-centred teaching for youth, families and clergy.' },
  { icon: Flame, title: 'Mass intentions', text: 'Your intentions offered at the altar on the day you request.' },
]

export function WelcomeSection() {
  return (
    <section className='py-24 sm:py-28'>
      <div className='container grid items-center gap-16 lg:grid-cols-2'>
        <div className='relative'>
          <div className='relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift sm:w-4/5'>
            <SmartImage src={imagery.candles} alt='Candles lit in prayer' fill sizes='(min-width: 1024px) 40vw, 90vw' className='object-cover' />
          </div>
          <div className='absolute -bottom-10 right-0 hidden aspect-square w-1/2 overflow-hidden rounded-[2rem] border-8 border-ivory shadow-lift sm:block'>
            <SmartImage src={imagery.bibleReading} alt='An open Bible' fill sizes='25vw' className='object-cover' />
          </div>
          <div className='absolute -left-4 top-10 hidden rounded-2xl bg-navy-900 px-5 py-4 text-white shadow-lift md:block'>
            <p className='font-display text-3xl italic text-gold-300'>“Be merciful,</p>
            <p className='font-display text-3xl italic text-gold-300'>as your Father is.”</p>
            <p className='mt-1 text-xs uppercase tracking-widest text-navy-200'>Luke 6:36</p>
          </div>
        </div>

        <div>
          <p className='eyebrow'>Welcome to DMRC</p>
          <h2 className='mt-3 text-4xl leading-tight sm:text-5xl'>A house of prayer where hearts are renewed in God’s mercy.</h2>
          <p className='mt-6 text-lg leading-relaxed text-muted-foreground'>
            Set in the quiet hills of Vikindu, the Divine Mercy Retreat Center welcomes individuals, families, parishes and religious
            communities to step away from the noise and encounter Christ through the Word, the Sacraments and healing prayer.
          </p>
          <div className='mt-10 grid gap-6 sm:grid-cols-2'>
            {offerings.map((item) => (
              <div key={item.title} className='flex gap-4'>
                <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-700'>
                  <item.icon className='h-5 w-5' />
                </span>
                <div>
                  <h3 className='font-semibold text-navy-900'>{item.title}</h3>
                  <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Button asChild variant='link' className='mt-10 text-base'>
            <Link href='/about'>
              Discover our story <ArrowRight className='ml-1.5 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * Upcoming retreats
 * ------------------------------------------------------------------------- */

export function RetreatsSection({ retreats }: { retreats: HomepageRetreat[] }) {
  return (
    <section className='bg-parchment py-24 sm:py-28'>
      <div className='container'>
        <SectionHeading
          eyebrow='Upcoming retreats'
          title='Find your time of grace'
          description='Residential, parish and special retreats led by experienced preachers. Places are limited — reserve early.'
          action={
            <Button asChild variant='outline' size='pill' className='border-navy-200 bg-white'>
              <Link href='/retreats'>
                View all retreats <ArrowRight className='ml-1.5 h-4 w-4' />
              </Link>
            </Button>
          }
        />
        {retreats.length ? (
          <div className='mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {retreats.map((retreat) => (
              <RetreatCard key={retreat.id} retreat={retreat} />
            ))}
          </div>
        ) : (
          <div className='mt-14 rounded-3xl border border-dashed border-gold-300 bg-white/60 px-6 py-16 text-center'>
            <CalendarCheck className='mx-auto h-10 w-10 text-gold-500' />
            <h3 className='mt-4 font-display text-3xl text-navy-900'>New retreat dates are coming soon</h3>
            <p className='mx-auto mt-3 max-w-md text-muted-foreground'>
              Our next programme is being prepared. Call the office or check back shortly to reserve your place.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * How booking works
 * ------------------------------------------------------------------------- */

const bookingSteps = [
  { icon: CalendarCheck, title: 'Choose a retreat', text: 'Browse upcoming dates, speakers and available places.' },
  { icon: ClipboardCheck, title: 'Register in minutes', text: 'Add yourself and family members, then confirm your contribution.' },
  { icon: QrCode, title: 'Receive your ticket', text: 'Get a QR-code ticket by email for fast check-in on arrival.' },
]

export function BookingStepsSection() {
  return (
    <section className='py-24 sm:py-28'>
      <div className='container'>
        <SectionHeading align='center' eyebrow='Simple booking' title='From prayerful intention to confirmed place' />
        <div className='relative mt-16'>
        <div aria-hidden className='absolute left-[16%] right-[16%] top-8 hidden h-px bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 md:block' />
        <ol className='relative grid gap-10 md:grid-cols-3'>
          {bookingSteps.map((step, i) => (
            <li key={step.title} className='relative text-center'>
              <span className='relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold-200 bg-ivory text-navy-900 shadow-soft'>
                <step.icon className='h-6 w-6' />
                <span className='absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-navy-950'>
                  {i + 1}
                </span>
              </span>
              <h3 className='mt-6 font-display text-2xl font-semibold text-navy-900'>{step.title}</h3>
              <p className='mx-auto mt-2 max-w-xs text-muted-foreground'>{step.text}</p>
            </li>
          ))}
        </ol>
        </div>
        <div className='mt-14 flex justify-center'>
          <Button asChild size='xl'>
            <Link href='/retreats'>
              Start your booking <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * Mass intentions & giving
 * ------------------------------------------------------------------------- */

export function MassAndGivingSection() {
  const panels = [
    {
      eyebrow: 'Mass intentions',
      title: 'Offer a Holy Mass for someone you love',
      text: 'For thanksgiving, healing, the faithful departed or a special intention. Choose a date and we will offer it at the altar.',
      href: '/mass-intentions',
      cta: 'Request a Mass',
      icon: Flame,
      image: imagery.churchInterior,
    },
    {
      eyebrow: 'Give',
      title: 'Partner with the mission of mercy',
      text: 'Your gift sustains retreats for those who cannot afford them, our outreach to the poor and the care of this holy place.',
      href: '/donation',
      cta: 'Give online',
      icon: HeartHandshake,
      image: imagery.prayerHands,
    },
  ]

  return (
    <section className='pb-24 sm:pb-28'>
      <div className='container grid gap-6 lg:grid-cols-2'>
        {panels.map((panel) => (
          <Link
            key={panel.href}
            href={panel.href}
            className='group relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[2rem] p-8 text-white shadow-lift sm:p-10'
          >
            <SmartImage
              src={panel.image}
              alt=''
              fill
              sizes='(min-width: 1024px) 50vw, 100vw'
              className='-z-10 object-cover transition-transform duration-700 group-hover:scale-105'
            />
            <div className='absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/10' />
            <span className='mb-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-gold-300 backdrop-blur'>
              <panel.icon className='h-5 w-5' />
            </span>
            <p className='eyebrow mt-10 text-gold-300'>{panel.eyebrow}</p>
            <h3 className='mt-3 max-w-md font-display text-4xl font-semibold leading-tight'>{panel.title}</h3>
            <p className='mt-4 max-w-md text-navy-100'>{panel.text}</p>
            <span className='mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-medium text-navy-950 transition group-hover:bg-gold-300'>
              {panel.cta} <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * Patrons / spiritual directors
 * ------------------------------------------------------------------------- */

export function PatronsSection({ patrons }: { patrons: PatronView[] }) {
  if (!patrons.length) return null
  return (
    <section className='bg-navy-950 py-24 text-white sm:py-28'>
      <div className='container'>
        <div className='max-w-2xl'>
          <p className='eyebrow text-gold-300'>Spiritual leadership</p>
          <h2 className='mt-3 text-4xl leading-tight text-white sm:text-5xl'>Shepherds who accompany you</h2>
        </div>
        <div className='mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {patrons.map((patron) => (
            <figure key={patron.id} className='group'>
              <div className='relative aspect-[4/5] overflow-hidden rounded-3xl bg-navy-800'>
                <SmartImage
                  src={patron.imageUrl}
                  alt={patron.name}
                  fill
                  sizes='(min-width: 1024px) 25vw, 50vw'
                  className='object-cover grayscale-[30%] transition duration-500 group-hover:scale-105 group-hover:grayscale-0'
                />
              </div>
              <figcaption className='mt-5'>
                <p className='font-display text-2xl font-semibold'>{patron.name}</p>
                <p className='text-sm font-medium text-gold-300'>{patron.title}</p>
                {patron.role && <p className='mt-2 text-sm leading-relaxed text-navy-200'>{patron.role}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * Testimonials
 * ------------------------------------------------------------------------- */

export function TestimonialsSection({ testimonials }: { testimonials: TestimonialView[] }) {
  if (!testimonials.length) return null
  const [featured, ...rest] = testimonials
  return (
    <section className='py-24 sm:py-28'>
      <div className='container'>
        <SectionHeading align='center' eyebrow='Testimonies' title='Lives touched by mercy' />
        <div className='mt-14 grid gap-6 lg:grid-cols-3'>
          <figure className='relative flex flex-col justify-between rounded-[2rem] bg-navy-900 p-10 text-white lg:row-span-2'>
            <Quote className='h-10 w-10 text-gold-400' />
            <blockquote className='mt-6 font-display text-3xl leading-snug'>“{featured.quote}”</blockquote>
            <figcaption className='mt-10 flex items-center gap-4'>
              <span className='relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-gold-300'>
                <SmartImage src={featured.imageUrl} alt='' fill sizes='56px' className='object-cover' />
              </span>
              <span>
                <span className='block font-semibold'>{featured.name}</span>
                <span className='block text-sm text-navy-200'>{featured.role}</span>
              </span>
            </figcaption>
          </figure>
          {rest.slice(0, 4).map((item) => (
            <figure key={item.id} className='flex flex-col justify-between rounded-[2rem] border border-border bg-white p-8 shadow-soft'>
              <blockquote className='text-lg leading-relaxed text-navy-800'>“{item.quote}”</blockquote>
              <figcaption className='mt-8 flex items-center gap-3'>
                <span className='relative h-11 w-11 overflow-hidden rounded-full'>
                  <SmartImage src={item.imageUrl} alt='' fill sizes='44px' className='object-cover' />
                </span>
                <span>
                  <span className='block text-sm font-semibold text-navy-900'>{item.name}</span>
                  <span className='block text-sm text-muted-foreground'>{item.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
 * Gallery preview
 * ------------------------------------------------------------------------- */

export function GalleryPreviewSection({ items }: { items: GalleryPreviewItem[] }) {
  if (!items.length) return null
  return (
    <section className='bg-parchment py-24 sm:py-28'>
      <div className='container'>
        <SectionHeading
          eyebrow='Gallery'
          title='Moments of grace at DMRC'
          action={
            <Button asChild variant='outline' size='pill' className='border-navy-200 bg-white'>
              <Link href='/gallery'>
                Open the gallery <ArrowRight className='ml-1.5 h-4 w-4' />
              </Link>
            </Button>
          }
        />
        <div className='mt-14 grid auto-rows-[180px] grid-cols-2 gap-4 md:auto-rows-[220px] md:grid-cols-4'>
          {items.map((item, i) => (
            <Link
              key={item.id}
              href='/gallery'
              className={
                'group relative overflow-hidden rounded-3xl bg-navy-100 ' +
                (i === 0 ? 'col-span-2 row-span-2' : i === 3 ? 'md:col-span-2' : '')
              }
            >
              <SmartImage
                src={item.src}
                alt={item.title}
                fill
                sizes='(min-width: 768px) 50vw, 100vw'
                className='object-cover transition-transform duration-700 group-hover:scale-105'
              />
              <div className='absolute inset-0 flex items-end bg-gradient-to-t from-navy-950/70 via-transparent to-transparent p-5 opacity-0 transition-opacity group-hover:opacity-100'>
                <span className='font-medium text-white'>{item.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
