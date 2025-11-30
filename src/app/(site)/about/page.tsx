'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Church, Users, History, Target, Eye, Crown,
  ChevronRight, Globe, Building2, BookOpen,
  Sparkles, Heart, Cross, Shield, LucideIcon
} from 'lucide-react'

// Types
type Person = {
  name: string
  role: string
  image: string
  description?: string
}

type Center = {
  id: string
  name: string
  shortName: string
  icon: LucideIcon
  color: string
}

// Data for Centers
const centers: Center[] = [
  { id: 'vincentian', name: 'Vincentian Congregation', shortName: 'VC', icon: Church, color: 'blue' },
  { id: 'marymatha', name: 'Marymatha Province', shortName: 'MP', icon: Crown, color: 'purple' },
  { id: 'sh-region', name: 'SH Region - East Africa', shortName: 'SH', icon: Globe, color: 'emerald' },
  { id: 'dmrc', name: 'DMRC Vikindu', shortName: 'DMRC', icon: Building2, color: 'amber' },
]

// Vincentian Congregation Data
const vincentianData = {
  history: {
    title: 'Our History',
    content: `The Vincentian Congregation (VC) is a religious congregation of men founded in 1904 at Thottakom, Kerala, India. The congregation traces its spiritual lineage to St. Vincent de Paul, the great apostle of charity. What began as a small community of dedicated priests has grown into a global family serving the Church across continents.

The congregation was established with the vision of serving the poor, marginalized, and spiritually hungry. Over the decades, the VC has expanded its mission to include education, healthcare, social welfare, and retreat ministry. Today, the Vincentian Congregation operates in multiple countries, bringing the message of God&apos;s mercy and love to all.`,
    milestones: [
      { year: '1904', event: 'Foundation at Thottakom, Kerala' },
      { year: '1927', event: 'First mission outside Kerala' },
      { year: '1968', event: 'International expansion begins' },
      { year: '1995', event: 'East African mission established' },
      { year: '2010', event: 'DMRC Vikindu inaugurated' },
    ]
  },
  patrons: [
    { name: 'St. Vincent de Paul', role: 'Primary Patron', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', description: 'The apostle of charity whose spirit of service to the poor inspires our mission.' },
  ],
  superiors: [
    { name: 'Very Rev. Fr. Varghese Gnalian VC', role: 'Superior General', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80', description: 'Leading the global congregation.' },
    { name: 'Rev. Fr. Thomas Mathew VC', role: 'Vicar General', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', description: 'Assisting in governance.' },
  ],
  charisma: {
    content: 'The Vincentian Congregation is called to follow Christ the Evangelizer of the Poor. Our charisma centers on proclaiming the Gospel through works of mercy, education, and spiritual formation.',
    pillars: [
      { icon: Heart, title: 'Charity', description: 'Serving the poor with compassion' },
      { icon: BookOpen, title: 'Evangelization', description: 'Proclaiming the Good News' },
    ]
  },
  objectives: [
    'To evangelize the poor and marginalized',
    'To provide quality education',
    'To establish retreat centers',
  ],
  vcAtGlance: { founded: '1904', provinces: '8 Provinces', members: '1,200+ Members' },
}

const marymathaData = {
  superiors: [
    { name: 'Very Rev. Fr. Sebastian Thekkanath VC', role: 'Provincial Superior', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', description: 'Guiding Marymatha Province.' },
  ],
}

const shRegionData = {
  superiors: [
    { name: 'Very Rev. Fr. Xavier Khan Vattayil VC', role: 'Regional Superior', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80', description: 'Pioneering Vincentian mission in East Africa.' },
  ],
}

const dmrcData = {
  history: {
    content: `Divine Mercy Retreat Center (DMRC) Vikindu stands as a beacon of spiritual renewal in East Africa. Established in 2010 by the Vincentian Congregation, the center has grown to become one of the most vibrant retreat facilities in Tanzania.`,
    milestones: [
      { year: '2010', event: 'DMRC Vikindu officially inaugurated' },
      { year: '2016', event: 'Accommodation expanded' },
    ]
  },
  emblem: {
    description: 'The DMRC emblem symbolizes our identity and mission with Divine Mercy rays emanating from the Heart of Jesus.',
    elements: [
      { name: 'Divine Mercy Rays', meaning: 'Grace and mercy flowing from Christ' },
      { name: 'Sacred Heart', meaning: 'The compassionate love of Jesus' },
    ]
  },
  superiors: [
    { name: 'Rev. Fr. Christo Thekkanath VC', role: 'Director, DMRC Vikindu', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', description: 'Leading DMRC with pastoral vision.' },
  ],
}

// Components
const PersonCard = ({ person }: { person: Person }) => (
  <div className='bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group'>
    <div className='relative h-56 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200'>
      <Image src={person.image} alt={person.name} fill className='object-cover transition-transform duration-500 group-hover:scale-105' />
      <div className='absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent' />
    </div>
    <div className='p-5'>
      <h4 className='font-bold text-slate-900 text-lg'>{person.name}</h4>
      <p className='text-blue-600 font-medium text-sm mt-1'>{person.role}</p>
      {person.description && <p className='text-slate-600 text-sm mt-3 line-clamp-2'>{person.description}</p>}
    </div>
  </div>
)

const SectionTitle = ({ icon: Icon, title, subtitle, color = 'blue' }: { icon: LucideIcon; title: string; subtitle?: string; color?: string }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
  }
  return (
    <div className='mb-10'>
      <div className='flex items-center gap-3 mb-3'>
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}><Icon className='w-5 h-5' /></div>
        <h3 className='text-2xl font-bold text-slate-900'>{title}</h3>
      </div>
      {subtitle && <p className='text-slate-600 max-w-3xl'>{subtitle}</p>}
    </div>
  )
}

export default function AboutPage() {
  const [activeCenter, setActiveCenter] = useState('vincentian')

  const getColorClasses = (centerId: string, isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string }> = {
      vincentian: { active: 'bg-blue-600 text-white border-blue-600', inactive: 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50' },
      marymatha: { active: 'bg-purple-600 text-white border-purple-600', inactive: 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50' },
      'sh-region': { active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50' },
      dmrc: { active: 'bg-amber-600 text-white border-amber-600', inactive: 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50' },
    }
    return isActive ? colors[centerId].active : colors[centerId].inactive
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Hero Section */}
      <section className='relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 lg:py-32'>
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute inset-0' style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        </div>
        <div className='relative container mx-auto max-w-6xl px-4'>
          <div className='text-center'>
            <span className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6 border border-white/20'>
              <Church className='w-4 h-4' /> About Our Organization
            </span>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight'>
              United in Mission,
              <span className='block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400'>Serving with Mercy</span>
            </h1>
            <p className='text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed'>
              Discover the rich heritage, leadership, and mission of the Vincentian Congregation and its centers across the globe.
            </p>
          </div>
        </div>
      </section>

      {/* Center Navigation */}
      <section className='sticky top-[88px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm'>
        <div className='container mx-auto max-w-6xl px-4'>
          <div className='flex items-center gap-3 py-4 overflow-x-auto scrollbar-hide'>
            {centers.map((center) => {
              const isActive = activeCenter === center.id
              const Icon = center.icon
              return (
                <button
                  key={center.id}
                  onClick={() => setActiveCenter(center.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 font-semibold text-sm transition-all whitespace-nowrap ${getColorClasses(center.id, isActive)}`}
                >
                  <Icon className='w-4 h-4' />
                  <span className='hidden sm:inline'>{center.name}</span>
                  <span className='sm:hidden'>{center.shortName}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className='py-12 lg:py-16'>
        <div className='container mx-auto max-w-6xl px-4'>
          {/* Vincentian Congregation */}
          <div className={activeCenter === 'vincentian' ? 'block' : 'hidden'}>
            <div className='space-y-16'>
              <div>
                <SectionTitle icon={History} title='Our History' subtitle='The journey of faith that shaped our congregation' color='blue' />
                <div className='grid lg:grid-cols-3 gap-8'>
                  <div className='lg:col-span-2 prose prose-slate max-w-none'>
                    <p className='text-slate-600 leading-relaxed'>{vincentianData.history.content}</p>
                  </div>
                  <div className='bg-white rounded-2xl border border-slate-200 p-6'>
                    <h4 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                      <Sparkles className='w-4 h-4 text-blue-600' /> Key Milestones
                    </h4>
                    <div className='space-y-4'>
                      {vincentianData.history.milestones.map((m, i) => (
                        <div key={i} className='flex gap-4'>
                          <div className='w-16 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0'>{m.year}</div>
                          <p className='text-sm text-slate-600'>{m.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle icon={Shield} title='Our Patrons' subtitle='The saints who inspire our mission' color='blue' />
                <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {vincentianData.patrons.map((p, i) => <PersonCard key={i} person={p} />)}
                </div>
              </div>

              <div>
                <SectionTitle icon={Heart} title='Our Charisma' subtitle='The spiritual identity that defines who we are' color='blue' />
                <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100'>
                  <p className='text-slate-700 leading-relaxed mb-8 text-lg'>{vincentianData.charisma.content}</p>
                  <div className='grid sm:grid-cols-2 gap-6'>
                    {vincentianData.charisma.pillars.map((p, i) => {
                      const PIcon = p.icon
                      return (
                        <div key={i} className='bg-white rounded-xl p-5 border border-blue-100'>
                          <div className='w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4'><PIcon className='w-6 h-6' /></div>
                          <h4 className='font-bold text-slate-900 mb-2'>{p.title}</h4>
                          <p className='text-sm text-slate-600'>{p.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle icon={Target} title='Our Objectives' subtitle='Goals that guide our ministries' color='blue' />
                <div className='grid sm:grid-cols-2 gap-4'>
                  {vincentianData.objectives.map((obj, i) => (
                    <div key={i} className='flex items-start gap-4 bg-white rounded-xl p-5 border border-slate-200'>
                      <div className='w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0'>{i + 1}</div>
                      <p className='text-slate-700'>{obj}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle icon={Eye} title='VC at a Glance' subtitle='Quick facts' color='blue' />
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                  {Object.entries(vincentianData.vcAtGlance).map(([key, value]) => (
                    <div key={key} className='bg-white rounded-xl p-5 border border-slate-200 text-center'>
                      <p className='text-2xl font-bold text-blue-600 mb-1'>{value}</p>
                      <p className='text-sm text-slate-500 capitalize'>{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle icon={Users} title='Our Superiors' subtitle='Leadership guiding the congregation' color='blue' />
                <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {vincentianData.superiors.map((s, i) => <PersonCard key={i} person={s} />)}
                </div>
              </div>
            </div>
          </div>

          {/* Marymatha Province */}
          <div className={activeCenter === 'marymatha' ? 'block' : 'hidden'}>
            <div className='space-y-16'>
              <div className='text-center max-w-3xl mx-auto'>
                <div className='w-20 h-20 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-6'><Crown className='w-10 h-10' /></div>
                <h2 className='text-3xl font-bold text-slate-900 mb-4'>Marymatha Province</h2>
                <p className='text-lg text-slate-600'>Marymatha Province serves as a vital region of the Vincentian Congregation, dedicated to evangelization, education, and charitable works.</p>
              </div>
              <div>
                <SectionTitle icon={Users} title='Provincial Leadership' subtitle='The superiors guiding Marymatha Province' color='purple' />
                <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {marymathaData.superiors.map((s, i) => <PersonCard key={i} person={s} />)}
                </div>
              </div>
            </div>
          </div>

          {/* SH Region */}
          <div className={activeCenter === 'sh-region' ? 'block' : 'hidden'}>
            <div className='space-y-16'>
              <div className='text-center max-w-3xl mx-auto'>
                <div className='w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6'><Globe className='w-10 h-10' /></div>
                <h2 className='text-3xl font-bold text-slate-900 mb-4'>Sacred Heart Region - East Africa</h2>
                <p className='text-lg text-slate-600'>The Sacred Heart Region represents the Vincentian presence in East Africa, bringing the Gospel message and works of mercy to Tanzania and neighboring nations.</p>
              </div>
              <div>
                <SectionTitle icon={Users} title='Regional Leadership' subtitle='The superiors guiding the East African mission' color='emerald' />
                <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {shRegionData.superiors.map((s, i) => <PersonCard key={i} person={s} />)}
                </div>
              </div>
            </div>
          </div>

          {/* DMRC Vikindu */}
          <div className={activeCenter === 'dmrc' ? 'block' : 'hidden'}>
            <div className='space-y-16'>
              <div>
                <SectionTitle icon={History} title='History of DMRC Vikindu' subtitle='The story of Divine Mercy Retreat Center' color='amber' />
                <div className='grid lg:grid-cols-3 gap-8'>
                  <div className='lg:col-span-2 prose prose-slate max-w-none'>
                    <p className='text-slate-600 leading-relaxed'>{dmrcData.history.content}</p>
                  </div>
                  <div className='bg-white rounded-2xl border border-slate-200 p-6'>
                    <h4 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                      <Sparkles className='w-4 h-4 text-amber-600' /> Timeline
                    </h4>
                    <div className='space-y-4'>
                      {dmrcData.history.milestones.map((m, i) => (
                        <div key={i} className='flex gap-4'>
                          <div className='w-16 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold flex-shrink-0'>{m.year}</div>
                          <p className='text-sm text-slate-600'>{m.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle icon={Shield} title='Our Emblem' subtitle='The symbols that represent our identity' color='amber' />
                <div className='bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100'>
                  <div className='grid lg:grid-cols-2 gap-8 items-center'>
                    <div>
                      <p className='text-slate-700 leading-relaxed mb-6'>{dmrcData.emblem.description}</p>
                      <div className='space-y-3'>
                        {dmrcData.emblem.elements.map((e, i) => (
                          <div key={i} className='flex items-center gap-3 bg-white rounded-lg p-3 border border-amber-100'>
                            <div className='w-3 h-3 rounded-full bg-amber-500' />
                            <div><span className='font-semibold text-slate-900'>{e.name}:</span><span className='text-slate-600 ml-2'>{e.meaning}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className='flex justify-center'>
                      <div className='w-64 h-64 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-4 border-amber-200'>
                        <div className='text-center'>
                          <Cross className='w-16 h-16 text-amber-600 mx-auto mb-2' />
                          <p className='text-sm font-bold text-amber-800'>DMRC</p>
                          <p className='text-xs text-amber-600'>Vikindu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle icon={Users} title='DMRC Leadership' subtitle='The team leading Divine Mercy Retreat Center' color='amber' />
                <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {dmrcData.superiors.map((s, i) => <PersonCard key={i} person={s} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20'>
        <div className='container mx-auto max-w-4xl px-4 text-center'>
          <h2 className='text-3xl font-bold text-white mb-4'>Join Our Mission</h2>
          <p className='text-slate-300 mb-8 max-w-2xl mx-auto'>
            Whether through retreats, volunteering, or partnership, discover how you can be part of bringing God&apos;s mercy to the world.
          </p>
          <div className='flex flex-wrap justify-center gap-4'>
            <Link href='/retreats' className='inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors'>
              Book a Retreat <ChevronRight className='w-4 h-4' />
            </Link>
            <Link href='/donation' className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors'>
              Support Our Mission <Heart className='w-4 h-4' />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
