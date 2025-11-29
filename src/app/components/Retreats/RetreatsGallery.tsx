'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'

import { RetreatCategory, RetreatType } from '@/app/types/retreat'
import CourseDetailSkeleton from '../Skeleton/CourseDetail'
import { ArrowRight, ArrowUpRight, Calendar, MapPin, Users } from 'lucide-react'

const statusStyles: Record<RetreatType['status'], string> = {
  'Registration Open': 'bg-emerald-500 text-white',
  Waitlist: 'bg-amber-500 text-white',
  Closed: 'bg-slate-400 text-white',
}

const categoryConfig: Record<RetreatCategory, { label: string }> = {
  all: { label: 'All' },
  residential: { label: 'Residential' },
  parish: { label: 'Parish' },
  special: { label: 'Special' },
  'jesus-mission': { label: 'Jesus Mission' },
}

interface RetreatsGalleryProps {
  title: string
  description?: string
  action?: {
    label: string
    href: string
  }
  showFilters?: boolean
}

const currencyFormatter =
  typeof Intl !== 'undefined'
    ? new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 })
    : null

const fetchRetreats = async (): Promise<RetreatType[]> => {
  const res = await fetch('/api/retreats', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to load retreats')
  }
  const data = await res.json()
  return data.data ?? []
}

const RetreatsGallery = ({
  title,
  description,
  action,
  showFilters = true,
}: RetreatsGalleryProps) => {
  const [selectedCategory, setSelectedCategory] = useState<RetreatCategory>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const {
    data: retreats = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['retreats'],
    queryFn: fetchRetreats,
    staleTime: 1000 * 60,
  })

  const filteredRetreats = useMemo(() => {
    if (selectedCategory === 'all') return retreats
    return retreats.filter((retreat) => retreat.category === selectedCategory)
  }, [retreats, selectedCategory])

  return (
    <div className='space-y-10'>
      {/* Header */}
      <div className='flex flex-col md:flex-row justify-between md:items-end gap-6'>
        <div className='max-w-2xl'>
          <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4'>
            <span className='w-1.5 h-1.5 rounded-full bg-blue-500' />
            Spiritual Encounters
          </span>
          <h2 className='text-4xl font-bold text-slate-900 mb-4'>{title}</h2>
          {description && <p className='text-lg text-slate-600 leading-relaxed'>{description}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className='hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl group'
          >
            {action.label}
            <ArrowUpRight className='w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
          </Link>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className='flex flex-wrap gap-2'>
          {Object.entries(categoryConfig).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as RetreatCategory)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === key
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      )}

      {/* Cards Grid - Modern Bento Style */}
      <motion.div layout className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
        <AnimatePresence mode='popLayout'>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-white rounded-3xl p-6 h-[380px] animate-pulse'
              >
                <div className='h-40 bg-slate-100 rounded-2xl mb-4' />
                <div className='h-4 bg-slate-100 rounded w-3/4 mb-2' />
                <div className='h-4 bg-slate-100 rounded w-1/2' />
              </motion.div>
            ))
          ) : isError ? (
            <div className='col-span-full text-center py-12'>
              <p className='text-red-500'>Unable to load retreats right now.</p>
            </div>
          ) : filteredRetreats.length > 0 ? (
            filteredRetreats.map((retreat, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                key={retreat.id}
                onMouseEnter={() => setHoveredId(retreat.id)}
                onMouseLeave={() => setHoveredId(null)}
                className='group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100'
              >
                {/* Image Section */}
                <div className='relative h-44 overflow-hidden'>
                  <Image
                    src={retreat.imageSrc}
                    alt={retreat.title}
                    fill
                    className={`object-cover transition-all duration-700 ${
                      hoveredId === retreat.id ? 'scale-110 blur-[1px]' : 'scale-100'
                    }`}
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />
                  
                  {/* Status Badge */}
                  <div className='absolute top-4 left-4'>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyles[retreat.status]}`}>
                      {retreat.status}
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className='absolute top-4 right-4'>
                    <span className='px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-900 shadow-lg'>
                      {retreat.isPaid === false
                        ? 'Free'
                        : typeof retreat.price === 'number' && currencyFormatter
                        ? currencyFormatter.format(retreat.price)
                        : 'Paid'}
                    </span>
                  </div>

                  {/* Bottom overlay info */}
                  <div className='absolute bottom-4 left-4 right-4 flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-white text-xs font-medium'>
                      <Calendar className='w-3.5 h-3.5' />
                      <span>{retreat.dateRange}</span>
                    </div>
                    <div className='flex items-center gap-2 text-white text-xs font-medium'>
                      <Users className='w-3.5 h-3.5' />
                      <span>{retreat.availability.total} spots</span>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className='p-5'>
                  {/* Speaker */}
                  <p className='text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2'>
                    with {retreat.speaker}
                  </p>
                  
                  {/* Title */}
                  <Link href={retreat.detailHref}>
                    <h3 className='text-lg font-bold text-slate-900 leading-snug mb-3 group-hover:text-blue-600 transition-colors line-clamp-2'>
                      {retreat.title}
                    </h3>
                  </Link>

                  {/* Location */}
                  <div className='flex items-center gap-2 text-slate-500 text-sm mb-4'>
                    <MapPin className='w-4 h-4' />
                    <span className='truncate'>{retreat.location}</span>
                  </div>

                  {/* Action Row */}
                  <div className='flex items-center gap-3'>
                    <Link
                      href={retreat.ctaHref}
                      className='flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold text-center hover:bg-blue-600 transition-colors flex items-center justify-center gap-2'
                    >
                      Book Now
                      <ArrowRight className='w-4 h-4' />
                    </Link>
                    <Link
                      href={retreat.detailHref}
                      className='p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-all'
                    >
                      <ArrowUpRight className='w-4 h-4' />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className='col-span-full text-center py-12 bg-slate-50 rounded-3xl'>
              <p className='text-slate-500 font-medium'>No retreats scheduled for this category.</p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile Action */}
      {action && (
        <div className='mt-8 text-center md:hidden'>
          <Link
            href={action.href}
            className='inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-lg group'
          >
            {action.label}
            <ArrowUpRight className='w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
          </Link>
        </div>
      )}
    </div>
  )
}

export default RetreatsGallery
