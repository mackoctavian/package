'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react'

type Testimonial = {
  id: string
  name: string
  role: string
  imageUrl: string
  quote: string
  rating: number
  order: number
  isActive: boolean
}

// Fallback testimonials
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Maria Josephat',
    role: 'Youth Retreat Participant',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    quote: 'The Divine Mercy Retreat Center changed my life. The peaceful environment and spiritual guidance helped me reconnect with my faith in ways I never thought possible.',
    rating: 5,
    order: 0,
    isActive: true,
  },
  {
    id: '2',
    name: 'Fr. Thomas Mwangi',
    role: 'Clergy Retreat Director',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    quote: 'As a priest, finding a place for personal renewal is essential. DMRC provides the perfect sanctuary for deep prayer and spiritual rejuvenation. I recommend it to all my fellow clergy.',
    rating: 5,
    order: 1,
    isActive: true,
  },
  {
    id: '3',
    name: 'Sarah & John Kimani',
    role: 'Family Retreat Attendees',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&q=80',
    quote: 'Our family retreat at DMRC brought us closer together. The programs for children and adults alike were thoughtfully designed. We left feeling renewed and united in our faith.',
    rating: 5,
    order: 2,
    isActive: true,
  },
  {
    id: '4',
    name: 'Emmanuel Okonkwo',
    role: 'Mission Volunteer',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    quote: 'Volunteering at the Divine Mercy Retreat Center has been a blessing. The community here is welcoming, and the mission work is truly impactful. I have grown so much spiritually.',
    rating: 5,
    order: 3,
    isActive: true,
  },
]

const Testimonial = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/homepage/testimonials')
        if (res.ok) {
          const data = await res.json()
          const activeTestimonials = (data.data || []).filter((t: Testimonial) => t.isActive)
          if (activeTestimonials.length > 0) {
            setTestimonials(activeTestimonials)
          } else {
            setTestimonials(FALLBACK_TESTIMONIALS)
          }
        } else {
          setTestimonials(FALLBACK_TESTIMONIALS)
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error)
        setTestimonials(FALLBACK_TESTIMONIALS)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const nextTestimonial = () => {
    setDirection(1)
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setDirection(-1)
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  }

  // Auto-advance testimonials
  useEffect(() => {
    if (testimonials.length <= 1) return
    const timer = setInterval(() => {
      nextTestimonial()
    }, 8000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  if (loading || testimonials.length === 0) {
    return (
      <section className='py-20 bg-gradient-to-b from-white to-slate-50'>
        <div className='container mx-auto'>
          <div className='animate-pulse'>
            <div className='h-8 bg-slate-200 rounded w-48 mx-auto mb-4' />
            <div className='h-12 bg-slate-200 rounded w-96 mx-auto mb-4' />
            <div className='h-64 bg-slate-200 rounded-3xl mx-auto' />
          </div>
        </div>
      </section>
    )
  }

  const currentTestimonial = testimonials[activeIndex]

  return (
    <section className='py-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden'>
      <div className='container mx-auto px-4 max-w-6xl'>
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className='text-center mb-16'
        >
          <span className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4'>
            <Quote className='w-3 h-3' />
            Testimonials
          </span>
          <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-4'>
            Stories of Transformation
          </h2>
          <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
            Hear from members of our community whose lives have been touched by their experiences at Divine Mercy Retreat Center.
          </p>
        </motion.div>

        {/* Testimonial Card */}
        <div className='relative mx-auto'>
          
          {/* Background Decorative Elements */}
          <div className='absolute -top-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50' />
          <div className='absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50' />
          
          {/* Main Card */}
          <div className='relative bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden'>
            <div className='grid md:grid-cols-5'>
              
              {/* Image Section */}
              <div className='md:col-span-2 relative h-64 md:h-auto bg-gradient-to-br from-blue-600 to-indigo-700'>
                <AnimatePresence mode='wait' custom={direction}>
                  <motion.div
                    key={currentTestimonial.id}
                    custom={direction}
                    variants={slideVariants}
                    initial='enter'
                    animate='center'
                    exit='exit'
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className='absolute inset-0'
                  >
                    <Image
                      src={currentTestimonial.imageUrl}
                      alt={currentTestimonial.name}
                      fill
                      sizes='(max-width: 768px) 100vw, 40vw'
                      className='object-cover'
                      loading='lazy'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/40 to-transparent md:bg-gradient-to-r' />
                  </motion.div>
                </AnimatePresence>
                
                {/* Quote Icon */}
                <div className='absolute top-6 left-6 p-3 rounded-full bg-white/20 backdrop-blur-sm'>
                  <Quote className='w-6 h-6 text-white' />
                </div>
                
                {/* Person Info - Mobile */}
                <div className='absolute bottom-6 left-6 right-6 md:hidden'>
                  <h3 className='text-xl font-bold text-white'>{currentTestimonial.name}</h3>
                  <p className='text-blue-200 text-sm'>{currentTestimonial.role}</p>
                </div>
              </div>
              
              {/* Content Section */}
              <div className='md:col-span-3 p-8 md:p-12 flex flex-col justify-center'>
                <AnimatePresence mode='wait' custom={direction}>
                  <motion.div
                    key={currentTestimonial.id}
                    custom={direction}
                    variants={slideVariants}
                    initial='enter'
                    animate='center'
                    exit='exit'
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  >
                    {/* Rating */}
                    <div className='flex gap-1 mb-6'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < currentTestimonial.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <blockquote className='text-xl md:text-2xl text-slate-700 leading-relaxed mb-8'>
                      &ldquo;{currentTestimonial.quote}&rdquo;
                    </blockquote>
                    
                    {/* Person Info - Desktop */}
                    <div className='hidden md:block'>
                      <h3 className='text-lg font-bold text-slate-900'>{currentTestimonial.name}</h3>
                      <p className='text-blue-600 font-medium text-sm'>{currentTestimonial.role}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          {testimonials.length > 1 && (
            <div className='flex items-center justify-center gap-4 mt-8'>
              <button
                onClick={prevTestimonial}
                className='p-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm'
                aria-label='Previous testimonial'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>
              
              {/* Dots */}
              <div className='flex gap-2'>
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > activeIndex ? 1 : -1)
                      setActiveIndex(index)
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? 'w-8 bg-blue-600'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextTestimonial}
                className='p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25'
                aria-label='Next testimonial'
              >
                <ChevronRight className='w-5 h-5' />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Testimonial
