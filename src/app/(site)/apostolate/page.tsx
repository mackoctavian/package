import Link from 'next/link'

const sections = [
  {
    id: 'mass-intentions',
    title: 'Mass Intentions',
    description:
      'Offer Masses for loved ones, healing, thanksgiving, or special petitions. Intentions are placed on the altar every Friday vigil and Sunday Eucharist.',
    actions: [
      { label: 'Submit an intention', href: '/mass-intentions' },
      { label: 'Learn how it works', href: '/news/mass-intentions-guide' },
    ],
  },
  {
    id: 'ministries',
    title: 'Mercy Ministries',
    description:
      'Serve with intercession, music, hospitality, or evangelisation teams. Training happens quarterly with on-going formation from our pastoral staff.',
    actions: [
      { label: 'View all ministries', href: '/ministries' },
      { label: 'Volunteer now', href: '/#volunteer' },
    ],
  },
  {
    id: 'saturday-service',
    title: 'Saturday Service',
    description:
      'Every Saturday we host mercy worship, confessions, and prayer teams from 3–8 PM. Join the rosary procession at 4 PM and vigils after sunset.',
    actions: [
      { label: 'Weekly schedule', href: '/events' },
      { label: 'Serve on a team', href: '/ministries/service' },
    ],
  },
  {
    id: 'counseling',
    title: 'Counseling & Care',
    description:
      'Meet with pastoral counsellors for spiritual direction, bereavement support, or marriage accompaniment. Confidential appointments available weekly.',
    actions: [
      { label: 'Book a session', href: '/#retreat-booking' },
      { label: 'Meet the team', href: '/about' },
    ],
  },
]

export default function ApostolatePage() {
  return (
    <section className='py-28'>
      <div className='container mx-auto max-w-6xl px-4'>
        <div className='space-y-4 text-center'>
          <p className='text-xs font-semibold uppercase tracking-[0.4em] text-primary'>Apostolate Hub</p>
          <h1 className='text-4xl font-semibold text-slate-900 sm:text-5xl'>Ministry that flows from the altar</h1>
          <p className='mx-auto max-w-3xl text-base text-slate-600'>
            Explore the different expressions of mercy at Divine Mercy Retreat Center. Hover over the navigation menu to
            jump directly to the section you need, or scroll below for quick details and links.
          </p>
        </div>

        <div className='mt-16 grid gap-8 md:grid-cols-2'>
          {sections.map((section) => (
            <article key={section.id} id={section.id} className='group rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-primary/40'>
              <div className='flex items-center justify-between gap-4'>
                <h2 className='text-2xl font-semibold text-slate-900'>{section.title}</h2>
                <span className='rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary'>
                  Apostolate
                </span>
              </div>
              <p className='mt-4 text-sm text-slate-600'>{section.description}</p>
              <div className='mt-6 flex flex-wrap gap-3'>
                {section.actions.map((action) => (
                  <Link key={action.href} href={action.href} className='inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/50'>
                    {action.label}
                    <span aria-hidden className='text-base'>
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

