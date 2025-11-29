'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import MentorSkeleton from '../../Skeleton/Mentor'
import { motion } from 'framer-motion'

type Patron = {
  id: string
  name: string
  title: string
  role?: string | null
  imageUrl: string
  bio?: string | null
  order: number
  isActive: boolean
}

// Fallback data
const FALLBACK_PATRONS = [
  {
    id: '1',
    name: 'Sr. Tamara Govedarovic',
    title: 'Patroness of Formation',
    imageUrl: '/images/patrons/tamara-govedarovic-TZ312UVgSIc-unsplash.jpg',
    role: 'Guides the ongoing formation of families and youth leaders.',
  },
  {
    id: '2',
    name: 'Rev. Julia Michelle',
    title: 'Pastoral Counsellor',
    imageUrl: '/images/patrons/julia-michelle-nDU6x8Qevow-unsplash.jpg',
    role: 'Provides pastoral care and spiritual accompaniment for retreatants.',
  },
  {
    id: '3',
    name: 'Fr. David M. Thomas',
    title: 'Mission Director',
    imageUrl: '/images/patrons/dm-david-Yv40MTMKrAs-unsplash.jpg',
    role: 'Oversees regional missions and supports parish outreach teams.',
  },
]

const Mentor = () => {
  const [patrons, setPatrons] = useState<Patron[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch from the new CMS API
        const res = await fetch('/api/homepage/patrons')
        if (res.ok) {
          const data = await res.json()
          const activePatrons = (data.data || []).filter((p: Patron) => p.isActive)
          if (activePatrons.length > 0) {
            setPatrons(activePatrons)
          } else {
            // Fall back to old API if no CMS data
            const oldRes = await fetch('/api/data')
            if (oldRes.ok) {
              const oldData = await oldRes.json()
              setPatrons(oldData.MentorData?.map((m: any, i: number) => ({
                id: String(i),
                name: m.name,
                title: m.title,
                role: m.role,
                imageUrl: m.imageSrc,
              })) || FALLBACK_PATRONS)
            } else {
              setPatrons(FALLBACK_PATRONS as Patron[])
            }
          }
        } else {
          setPatrons(FALLBACK_PATRONS as Patron[])
        }
      } catch (error) {
        console.error('Error fetching patrons:', error)
        setPatrons(FALLBACK_PATRONS as Patron[])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <section id='mentors-section' className='py-24 bg-white relative overflow-hidden'>
      {/* Decorative background elements */}
      <div className='absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3' />
      
      <div className='container relative'>
        <div className='flex flex-col gap-4 text-center sm:text-left sm:flex-row sm:items-end sm:justify-between mb-16'>
          <div className='space-y-4 max-w-2xl'>
            <span className='inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary'>
              Our Leadership
            </span>
            <h2 className='text-4xl md:text-5xl font-bold tracking-tight text-slate-900'>
              Faithful Shepherds
            </h2>
            <p className='text-lg text-slate-600 leading-relaxed'>
              Guiding our community with wisdom, dedication, and spiritual oversight to fulfill the mission of Divine Mercy Retreat Center.
            </p>
          </div>
          <div className="hidden sm:block">
            <a href="/about/team" className="text-primary font-semibold hover:text-blue-700 transition-colors flex items-center gap-2 group">
              Meet the full team <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10'>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <MentorSkeleton key={i} />)
            : patrons.slice(0, 3).map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  key={item.id}
                  className='group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100'
                >
                  <div className='aspect-[4/5] w-full overflow-hidden bg-slate-100 relative'>
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className='object-cover transition-transform duration-700 group-hover:scale-105'
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
                    
                    <div className="absolute bottom-0 left-0 p-6 w-full text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <p className='text-xs font-bold uppercase tracking-wider text-blue-200 mb-1'>
                        {item.title}
                      </p>
                      <h3 className='text-2xl font-bold'>{item.name}</h3>
                      <p className='text-sm text-slate-200 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75'>{item.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
        </div>
        
        <div className="mt-12 text-center sm:hidden">
          <a href="/about/team" className="text-primary font-semibold hover:text-blue-700 transition-colors flex items-center justify-center gap-2 group">
            Meet the full team <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default Mentor
