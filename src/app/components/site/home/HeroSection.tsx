'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, Flame, HeartHandshake, Ticket } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import { Button } from '@/app/components/ui/button'
import type { HeroSlideView } from '@/lib/site/homepage'
import { cn } from '@/lib/utils'

const ROTATION_MS = 7000

const quickActions = [
  {
    title: 'Book a retreat',
    description: 'Reserve your place in minutes',
    href: '/retreats',
    icon: CalendarCheck,
  },
  {
    title: 'Request a Mass',
    description: 'Offer a Mass intention',
    href: '/mass-intentions',
    icon: Flame,
  },
  {
    title: 'Give online',
    description: 'Support the mission of mercy',
    href: '/donation',
    icon: HeartHandshake,
  },
  {
    title: 'Manage booking',
    description: 'Find or download your ticket',
    href: '/retreats/check-booking',
    icon: Ticket,
  },
]

export default function HeroSection({ slides }: { slides: HeroSlideView[] }) {
  const [index, setIndex] = useState(0)
  const slide = slides[index] ?? slides[0]

  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(() => setIndex((value) => (value + 1) % slides.length), ROTATION_MS)
    return () => clearInterval(timer)
  }, [slides.length])

  const title = slide?.title || 'Come away and rest a while.'
  const subtitle =
    slide?.subtitle ||
    'Silent and preached retreats, daily Eucharist and healing prayer at the Divine Mercy Retreat Center in Vikindu, Tanzania.'

  return (
    <section className='relative !py-0'>
      <div className='relative isolate flex min-h-[640px] items-end overflow-hidden bg-navy-950 pb-40 pt-28 sm:min-h-[700px] lg:items-center lg:pb-48'>
        <AnimatePresence mode='sync'>
          <motion.div
            key={slide?.id}
            className='absolute inset-0 -z-10'
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.2 }, scale: { duration: ROTATION_MS / 1000 + 1.2, ease: 'linear' } }}
          >
            <SmartImage src={slide?.imageUrl} alt='' fill priority sizes='100vw' className='object-cover' />
          </motion.div>
        </AnimatePresence>
        <div className='absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/90 via-navy-950/60 to-navy-950/20' />
        <div className='absolute inset-0 -z-10 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent' />

        <div className='container'>
          <motion.div
            key={`copy-${slide?.id}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className='max-w-2xl'
          >
            <p className='eyebrow text-gold-300'>
              Divine Mercy Retreat Center<span className='hidden sm:inline'> · Vikindu</span>
            </p>
            <h1 className='mt-5 text-5xl leading-[1.05] text-white sm:text-6xl lg:text-7xl'>{title}</h1>
            <p className='mt-6 max-w-xl text-lg leading-relaxed text-navy-100'>{subtitle}</p>
            <div className='mt-9 flex flex-wrap gap-3'>
              <Button asChild size='xl' variant='gold'>
                <Link href={slide?.linkUrl || '/retreats'}>
                  {slide?.linkText || 'Find a retreat'} <ArrowRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
              <Button asChild size='xl' variant='outline-light'>
                <Link href='/mass-intentions'>Request a Mass intention</Link>
              </Button>
            </div>
          </motion.div>

          {slides.length > 1 && (
            <div className='mt-10 flex gap-2' role='tablist' aria-label='Hero slides'>
              {slides.map((item, i) => (
                <button
                  key={item.id}
                  type='button'
                  role='tab'
                  aria-selected={i === index}
                  aria-label={`Show slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-10 bg-gold-300' : 'w-5 bg-white/40 hover:bg-white/70')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions overlapping the hero */}
      <div className='container relative z-10 -mt-28'>
        <div className='grid gap-px overflow-hidden rounded-3xl border border-border bg-border shadow-lift sm:grid-cols-2 lg:grid-cols-4'>
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className='group flex items-start gap-4 bg-white p-6 transition-colors hover:bg-parchment lg:p-7'
            >
              <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-gold-300 transition-transform group-hover:-translate-y-0.5'>
                <action.icon className='h-5 w-5' />
              </span>
              <span>
                <span className='flex items-center gap-1.5 font-semibold text-navy-900'>
                  {action.title}
                  <ArrowRight className='h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100' />
                </span>
                <span className='mt-1 block text-sm text-muted-foreground'>{action.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
