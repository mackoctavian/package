import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Church, HandHeart, MessagesSquare, Users } from 'lucide-react'

import PageHero from '@/app/components/site/PageHero'
import { imagery } from '@/app/data/site'

export const metadata: Metadata = {
  title: 'Apostolate',
  description: 'Mass intentions, ministries, the Saturday service and pastoral care at the Divine Mercy Retreat Center.',
}

const sections = [
  {
    icon: Church,
    title: 'Mass intentions',
    description:
      'Offer Holy Mass for loved ones, healing, thanksgiving or special petitions. Intentions are placed on the altar at the Friday vigil and Sunday Eucharist.',
    actions: [
      { label: 'Request a Mass intention', href: '/mass-intentions' },
      { label: 'Support the mission', href: '/donation' },
    ],
  },
  {
    icon: Users,
    title: 'Mercy ministries',
    description:
      'Serve with intercession, music, hospitality or evangelisation teams. Training happens quarterly with ongoing formation from our pastoral staff.',
    actions: [
      { label: 'View all ministries', href: '/ministries' },
      { label: 'Spiritual partners', href: '/ministries/spiritual-partners' },
    ],
  },
  {
    icon: HandHeart,
    title: 'Saturday service',
    description:
      'Every Saturday we host mercy worship, confessions and prayer teams. Join the rosary procession in the afternoon and vigil after sunset.',
    actions: [
      { label: 'About the service', href: '/ministries/saturday-service' },
      { label: 'Upcoming retreats', href: '/retreats' },
    ],
  },
  {
    icon: MessagesSquare,
    title: 'Counselling and care',
    description:
      'Meet with pastoral counsellors for spiritual direction, bereavement support or marriage accompaniment. Confidential appointments are available weekly.',
    actions: [
      { label: 'Spiritual counselling', href: '/ministries/spiritual-counselling' },
      { label: 'Contact the office', href: '/#contact' },
    ],
  },
]

export default function ApostolatePage() {
  return (
    <main>
      <PageHero
        eyebrow='Apostolate'
        title='Ministry that flows from the altar'
        image={imagery.churchInterior}
        description='The different expressions of mercy at the Divine Mercy Retreat Center, and how to take part.'
      />
      <section>
        <div className='container grid gap-6 md:grid-cols-2'>
          {sections.map((section) => (
            <article key={section.title} className='flex flex-col rounded-[2rem] border border-border bg-white p-8 shadow-soft'>
              <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-parchment text-gold-600'>
                <section.icon className='h-6 w-6' />
              </span>
              <h2 className='mt-5 text-3xl'>{section.title}</h2>
              <p className='mt-3 flex-1 leading-relaxed text-muted-foreground'>{section.description}</p>
              <div className='mt-6 flex flex-wrap gap-x-6 gap-y-2'>
                {section.actions.map((action) => (
                  <Link key={action.href} href={action.href} className='group inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900'>
                    {action.label} <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
