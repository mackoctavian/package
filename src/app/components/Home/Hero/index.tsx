'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type HeroSlide = {
  id: string
  title?: string | null
  subtitle?: string | null
  imageUrl: string
  linkUrl?: string | null
  linkText?: string | null
  order: number
  isActive: boolean
}

// Fallback data if no slides in database
const FALLBACK_SLIDES = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1743951509643-745d7a4f582f?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1744741604701-6ac1f9129c8d?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1742802390589-fcb668109b51?auto=format&fit=crop&w=1920&q=80',
  },
]

const ROTATION_INTERVAL = 6000

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch slides from API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/homepage/hero')
        if (res.ok) {
          const data = await res.json()
          const activeSlides = (data.data || []).filter((s: HeroSlide) => s.isActive)
          if (activeSlides.length > 0) {
            setSlides(activeSlides)
          } else {
            setSlides(FALLBACK_SLIDES as HeroSlide[])
          }
        } else {
          setSlides(FALLBACK_SLIDES as HeroSlide[])
        }
      } catch (error) {
        setSlides(FALLBACK_SLIDES as HeroSlide[])
      } finally {
        setLoading(false)
      }
    }
    fetchSlides()
  }, [])

  // Auto-rotate slides
  useEffect(() => {
    if (slides.length <= 1) return
    
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, ROTATION_INTERVAL)

    return () => clearInterval(timer)
  }, [slides.length])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  if (loading || slides.length === 0) {
    return (
      <section className='relative h-[400px] md:h-[480px] lg:h-[540px] w-full overflow-hidden shadow-lg shadow-slate-200/50 rounded-2xl bg-slate-200 animate-pulse' />
    )
  }

  const currentSlide = slides[currentIndex]

  return (
    <section className='relative h-[400px] md:h-[480px] lg:h-[540px] w-full overflow-hidden shadow-lg shadow-slate-200/50 rounded-2xl'>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial='enter'
          animate='center'
          exit='exit'
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className='absolute inset-0 h-full w-full'>
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{ backgroundImage: `url(${currentSlide.imageUrl})` }}
          />
          
          {/* Overlay for text if title exists */}
          {(currentSlide.title || currentSlide.subtitle) && (
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent'>
              <div className='absolute bottom-16 left-8 right-8 text-white'>
                {currentSlide.title && (
                  <h2 className='text-3xl md:text-4xl font-bold mb-2'>{currentSlide.title}</h2>
                )}
                {currentSlide.subtitle && (
                  <p className='text-lg md:text-xl text-white/90'>{currentSlide.subtitle}</p>
                )}
                {currentSlide.linkUrl && currentSlide.linkText && (
                  <a
                    href={currentSlide.linkUrl}
                    className='inline-flex items-center gap-2 mt-4 px-6 py-2 bg-white text-slate-900 rounded-full font-medium hover:bg-white/90 transition-colors'
                  >
                    {currentSlide.linkText}
                  </a>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      {slides.length > 1 && (
        <div className='absolute bottom-8 right-8 flex gap-3 z-10'>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1)
                setCurrentIndex(index)
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default Hero
