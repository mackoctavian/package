import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'

import { ministriesData } from '@/app/data/ministries'

export const metadata: Metadata = {
  title: 'About Divine Mercy Retreat Center',
  description:
    'Discover the story, mission, and leadership of Divine Mercy Retreat Center as we serve the Church with mercy, formation, and evangelization.',
}

const missionPillars = [
  {
    title: 'Encounter Christ',
    description:
      'Providing spaces for Eucharistic adoration, healing prayer, and the sacraments so every pilgrim experiences the merciful heart of Jesus.',
  },
  {
    title: 'Form Missionary Disciples',
    description:
      'Equipping families, youth, and leaders with teaching, mentoring, and resources grounded in Catholic tradition and charismatic renewal.',
  },
  {
    title: 'Send Forth in Mercy',
    description:
      'Mobilizing outreach teams to parishes, campuses, and mission fields, extending mercy through service, evangelization, and social support.',
  },
]

const timeline = [
  {
    year: '2005',
    title: 'Humble Beginnings',
    description:
      'DMRC began as a small prayer group gathering for Divine Mercy devotions in a parish hall, responding to the call to share the mercy message.',
  },
  {
    year: '2010',
    title: 'Retreat Center Established',
    description:
      'With the blessing of diocesan leadership, the community acquired land at DMRC Hills, opening the first retreat house and chapel.',
  },
  {
    year: '2016',
    title: 'Global Mission Teams',
    description:
      'Mission teams expanded to the UK, Middle East, and North America, conducting healing services, conferences, and parish renewals.',
  },
  {
    year: '2023',
    title: 'Mercy Media Studio',
    description:
      'The center launched a media studio to livestream adoration, record testimonies, and equip parishes for digital evangelization.',
  },
]

const leadership = [
  {
    name: 'Rev. Fr. Xavier Khan Vattayil',
    role: 'Founder Director',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Rev. Fr. Soji Olikkal',
    role: 'Director, DMRC UK',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Rev. Fr. Christo Thekkanath',
    role: 'Mission Coordinator',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  },
]

const AboutPage = () => {
  return (
    <main>
      <section className='relative overflow-hidden bg-slate-950 py-32 text-white'>
        <div className='pointer-events-none absolute inset-0'>
          <Image
            src='https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=60'
            alt=''
            fill
            className='object-cover object-center opacity-30'
          />
          <div className='absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950' />
        </div>
        <div className='relative container mx-auto max-w-4xl px-4 text-center space-y-6'>
          <span className='inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80'>
            About DMRC
          </span>
          <h1 className='text-4xl font-semibold sm:text-5xl'>
            Proclaiming the mercy of Jesus to nations and generations
          </h1>
          <p className='text-base text-white/80 sm:text-lg'>
            For two decades, Divine Mercy Retreat Center has welcomed pilgrims into a rhythm of prayer, formation, and
            mission—sending missionary disciples to bring the mercy of Christ to parishes and communities worldwide.
          </p>
        </div>
      </section>

      <section className='bg-gray-50 py-16 sm:py-20'>
        <div className='container mx-auto max-w-6xl px-4 grid gap-12 lg:grid-cols-[1.2fr_1fr]'>
          <div className='space-y-6'>
            <h2 className='text-3xl font-semibold text-slate-900'>Our Story</h2>
            <p className='text-lg leading-8 text-slate-700'>
              What began as a small gathering of intercessors praying the Divine Mercy Chaplet has grown into an
              international movement of prayer, healing, and evangelization. Rooted in the Catholic charismatic renewal
              and under the guidance of diocesan leadership, Divine Mercy Retreat Center exists to form missionary
              disciples who carry mercy into every sphere of society.
            </p>
            <p className='text-lg leading-8 text-slate-700'>
              The center hosts retreats, missionary schools, media initiatives, and outreach missions. Every ministry
              flows from Eucharistic adoration and a deep conviction that the mercy of Jesus transforms hearts,
              families, and communities.
            </p>
            <div className='flex flex-wrap gap-4'>
              <Link
                href='/ministries'
                className='inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-primary/90'
              >
                Explore Ministries
                <span aria-hidden>→</span>
              </Link>
              <Link
                href='/retreats'
                className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary transition hover:border-primary hover:bg-primary/20'
              >
                Upcoming Retreats
              </Link>
            </div>
          </div>
          <div className='relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]'>
            <Image
              src='https://images.unsplash.com/photo-1542587227-8802646daa0d?auto=format&fit=crop&w=1600&q=80'
              alt='Divine Mercy Retreat Center chapel'
              width={800}
              height={600}
              className='w-full object-cover'
            />
            <div className='space-y-3 p-6 text-slate-700'>
              <h3 className='text-lg font-semibold text-slate-900'>Rooted in Mercy</h3>
              <p className='text-sm leading-6'>
                The DMRC chapel is the heart of every mission—adoration, confession, and praise fuel every outreach.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className='bg-white py-16 sm:py-20'>
        <div className='container mx-auto max-w-6xl px-4 space-y-10'>
          <div className='text-center space-y-3'>
            <h2 className='text-3xl font-semibold text-slate-900'>Our Mission Pillars</h2>
            <p className='text-base text-slate-600'>
              Each ministry initiative at DMRC flows from three core commitments that shape our pastoral vision.
            </p>
          </div>
          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {missionPillars.map((pillar) => (
              <div
                key={pillar.title}
                className='rounded-3xl border border-primary/20 bg-primary/5 p-8 shadow-[0_18px_44px_rgba(59,130,246,0.12)]'
              >
                <h3 className='text-xl font-semibold text-slate-900'>{pillar.title}</h3>
                <p className='mt-3 text-sm leading-6 text-slate-700'>{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-gray-50 py-16 sm:py-20'>
        <div className='container mx-auto max-w-6xl px-4 space-y-10'>
          <div className='text-center space-y-3'>
            <h2 className='text-3xl font-semibold text-slate-900'>A Timeline of Mercy</h2>
            <p className='text-base text-slate-600'>
              Moments of grace that have marked the growth of Divine Mercy Retreat Center.
            </p>
          </div>
          <div className='space-y-6'>
            {timeline.map((entry) => (
              <div
                key={entry.year}
                className='grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:grid-cols-[120px_1fr]'
              >
                <div className='flex items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                  <span className='text-xl font-semibold'>{entry.year}</span>
                </div>
                <div className='space-y-2'>
                  <h3 className='text-xl font-semibold text-slate-900'>{entry.title}</h3>
                  <p className='text-sm leading-6 text-slate-600'>{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-white py-16 sm:py-20'>
        <div className='container mx-auto max-w-6xl px-4 space-y-10'>
          <div className='text-center space-y-3'>
            <h2 className='text-3xl font-semibold text-slate-900'>Servant Leadership</h2>
            <p className='text-base text-slate-600'>
              Pastoral leadership, under the guidance of our bishops, shepherds every ministry with prayer and wisdom.
            </p>
          </div>
          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {leadership.map((leader) => (
              <div
                key={leader.name}
                className='overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]'
              >
                <div className='relative h-64 w-full overflow-hidden'>
                  <Image
                    src={leader.image}
                    alt={leader.name}
                    fill
                    className='object-cover object-center'
                  />
                </div>
                <div className='space-y-1 p-6 text-center'>
                  <h3 className='text-lg font-semibold text-slate-900'>{leader.name}</h3>
                  <p className='text-sm text-primary'>{leader.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-primary/10 py-16 sm:py-20'>
        <div className='container mx-auto max-w-5xl px-4 text-center space-y-6'>
          <h2 className='text-3xl font-semibold text-slate-900'>Where Mercy Becomes Mission</h2>
          <p className='text-base text-slate-600'>
            Divine Mercy Retreat Center hosts a family of ministries dedicated to healing, discipleship, and evangelization.
            Explore how the Lord might be inviting you to serve.
          </p>
          <div className='flex flex-wrap justify-center gap-4'>
            {ministriesData.slice(0, 3).map((ministry) => (
              <Link
                key={ministry.id}
                href={`/ministries/${ministry.slug}`}
                className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary transition hover:border-primary hover:bg-primary/10'
              >
                {ministry.title}
              </Link>
            ))}
          </div>
          <Link
            href='/#contact'
            className='inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-primary/90'
          >
            Connect with Us
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}

export default AboutPage

