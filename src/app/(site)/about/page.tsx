import type { Metadata } from 'next'
import { Cross, Heart } from 'lucide-react'

import PageHero from '@/app/components/site/PageHero'
import SectionHeading from '@/app/components/site/SectionHeading'
import SmartImage from '@/app/components/site/SmartImage'
import { congregation, dmrcStory, emblem, pillars } from '@/app/data/about'
import { imagery } from '@/app/data/site'
import { getAboutContent } from '@/lib/site/about'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'About DMRC',
  description:
    'The story, mission and leadership of the Divine Mercy Retreat Center in Vikindu, Tanzania, a house of the Vincentian Congregation.',
}

const initials = (name: string) =>
  name
    .replace(/^(Very |Rev\. |Fr\. |Sr\. )+/g, '')
    .split(/\s+/)
    .filter((part) => /^[A-Z]/.test(part) && part !== 'VC')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

const paragraphs = (text: string) => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

const Timeline = ({ items }: { items: { year: string; event: string }[] }) => (
  <ol className='relative space-y-6 border-l border-gold-300 pl-6'>
    {items.map((item) => (
      <li key={`${item.year}-${item.event}`} className='relative'>
        <span className='absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-gold-500' />
        <p className='font-display text-xl font-semibold text-gold-700'>{item.year}</p>
        <p className='text-sm text-navy-800'>{item.event}</p>
      </li>
    ))}
  </ol>
)

export default async function AboutPage() {
  const { history, mission, leaders } = await getAboutContent()

  return (
    <main>
      <PageHero
        eyebrow='About DMRC'
        title='A house of mercy in Vikindu'
        image={imagery.heroChapel}
        description='Divine Mercy Retreat Center is a home of prayer, healing and renewal, served by the priests of the Vincentian Congregation.'
      />

      <nav aria-label='On this page' className='sticky top-[72px] z-20 border-b border-border bg-white/90 backdrop-blur'>
        <div className='container flex gap-6 overflow-x-auto py-3 text-sm font-medium text-navy-700'>
          {[
            ['#story', 'Our story'],
            ['#mission', 'Mission'],
            ['#congregation', 'Vincentian Congregation'],
            ['#leadership', 'Leadership'],
          ].map(([href, label]) => (
            <a key={href} href={href} className='whitespace-nowrap hover:text-gold-700'>
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section id='story' className='scroll-mt-32'>
        <div className='container grid items-center gap-12 lg:grid-cols-2'>
          <div>
            <p className='eyebrow'>Our story</p>
            <h2 className='mt-3 text-4xl sm:text-5xl'>Rooted in prayer since 2010</h2>
            <div className='mt-6 space-y-4 text-lg leading-relaxed text-navy-800'>
              {paragraphs(history).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className='mt-8'>
              <Timeline items={dmrcStory.milestones} />
            </div>
          </div>
          <div className='relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift'>
            <SmartImage src={imagery.churchInterior} alt='Chapel interior' fill sizes='(min-width: 1024px) 50vw, 100vw' className='object-cover' />
          </div>
        </div>
      </section>

      <section id='mission' className='scroll-mt-32 bg-navy-950 text-white'>
        <div className='container'>
          <div className='mx-auto max-w-3xl text-center'>
            <p className='eyebrow text-gold-300'>Our mission</p>
            <p className='mt-5 font-display text-3xl leading-snug sm:text-4xl'>{mission}</p>
          </div>
          <div className='mt-14 grid gap-6 md:grid-cols-3'>
            {pillars.map((pillar, index) => (
              <div key={pillar.title} className='rounded-3xl border border-white/10 bg-white/5 p-8'>
                <span className='font-display text-3xl font-semibold text-gold-400'>{String(index + 1).padStart(2, '0')}</span>
                <h3 className='mt-3 font-sans text-xl font-semibold text-white'>{pillar.title}</h3>
                <p className='mt-2 text-sm leading-relaxed text-navy-100'>{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className='container grid items-center gap-10 rounded-[2rem] bg-parchment p-8 sm:p-12 lg:grid-cols-[1fr_auto]'>
          <div>
            <p className='eyebrow'>Our emblem</p>
            <p className='mt-3 text-lg leading-relaxed text-navy-800'>{emblem.description}</p>
            <ul className='mt-6 grid gap-3 sm:grid-cols-2'>
              {emblem.elements.map((element) => (
                <li key={element.name} className='rounded-2xl bg-white p-4'>
                  <p className='font-semibold text-navy-900'>{element.name}</p>
                  <p className='text-sm text-muted-foreground'>{element.meaning}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className='mx-auto flex h-48 w-48 flex-col items-center justify-center rounded-full border-4 border-gold-300 bg-white text-center'>
            <Cross className='h-12 w-12 text-gold-600' />
            <p className='mt-2 font-display text-2xl font-semibold text-navy-900'>DMRC</p>
            <p className='text-xs uppercase tracking-widest text-muted-foreground'>Vikindu</p>
          </div>
        </div>
      </section>

      <section id='congregation' className='scroll-mt-32 !pt-0'>
        <div className='container'>
          <SectionHeading eyebrow='Our family' title={congregation.name} description={congregation.charism} />
          <div className='mt-12 grid gap-12 lg:grid-cols-12'>
            <div className='lg:col-span-7'>
              <p className='text-lg leading-relaxed text-navy-800'>{congregation.history}</p>
              <dl className='mt-8 grid grid-cols-3 gap-4'>
                {congregation.stats.map((stat) => (
                  <div key={stat.label} className='rounded-2xl border border-border bg-white p-5 text-center'>
                    <dt className='text-xs uppercase tracking-widest text-muted-foreground'>{stat.label}</dt>
                    <dd className='mt-1 font-display text-3xl font-semibold text-navy-900'>{stat.value}</dd>
                  </div>
                ))}
              </dl>
              <h3 className='mt-10 font-sans text-lg font-semibold text-navy-900'>Our objectives</h3>
              <ul className='mt-4 space-y-3'>
                {congregation.objectives.map((objective) => (
                  <li key={objective} className='flex items-start gap-3 text-navy-800'>
                    <Heart className='mt-1 h-4 w-4 shrink-0 text-gold-500' /> {objective}
                  </li>
                ))}
              </ul>
              <div className='mt-10 grid gap-4 sm:grid-cols-2'>
                {congregation.structure.map((unit) => (
                  <div key={unit.name} className='rounded-2xl bg-parchment p-6'>
                    <p className='font-semibold text-navy-900'>{unit.name}</p>
                    <p className='mt-1 text-sm text-muted-foreground'>{unit.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className='lg:col-span-5'>
              <div className='rounded-[2rem] border border-border bg-white p-8'>
                <h3 className='font-display text-2xl font-semibold text-navy-900'>Key milestones</h3>
                <div className='mt-6'>
                  <Timeline items={congregation.milestones} />
                </div>
                <p className='mt-8 border-t border-border pt-6 text-sm text-muted-foreground'>
                  <span className='font-semibold text-navy-900'>Patron:</span> St. Vincent de Paul, apostle of charity, whose love for the poor
                  inspires our mission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id='leadership' className='scroll-mt-32 bg-parchment/60'>
        <div className='container'>
          <SectionHeading eyebrow='Leadership' title='Those who shepherd our mission' />
          <div className='mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {leaders.map((leader) => (
              <article key={leader.name} className='rounded-3xl border border-border bg-white p-6 text-center shadow-soft'>
                {leader.image ? (
                  <div className='relative mx-auto h-24 w-24 overflow-hidden rounded-full'>
                    <SmartImage src={leader.image} alt={leader.name} fill sizes='96px' className='object-cover' />
                  </div>
                ) : (
                  <span className='mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-navy-900 font-display text-3xl font-semibold text-gold-300'>
                    {initials(leader.name)}
                  </span>
                )}
                <h3 className='mt-5 font-display text-xl font-semibold leading-snug text-navy-900'>{leader.name}</h3>
                <p className='mt-1 text-sm font-medium text-gold-700'>{leader.role}</p>
                {leader.body && <p className='mt-3 text-sm text-muted-foreground'>{leader.body}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
