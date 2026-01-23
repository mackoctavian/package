'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

type Slide = { id: string | number; image: string }

const FALLBACK_HERO_IMAGE = '/images/404.svg'
const FALLBACK_SLIDES: Slide[] = [{ id: 'placeholder', image: FALLBACK_HERO_IMAGE }]

const ROTATION_INTERVAL = 6000

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/homepage/hero', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        const apiSlides =
          (json.data as any[])
            ?.filter((item) => item?.isActive !== false)
            ?.map((item) => ({
              id: item.id,
              image: item.imageUrl || FALLBACK_HERO_IMAGE,
            })) || []
        setSlides(apiSlides)
        setCurrentIndex(0)
      } catch (error) {
        console.error('[hero] failed to load slides', error)
        setSlides([])
        setCurrentIndex(0)
      }
    }
    fetchSlides()
  }, [])

  useEffect(() => {
    if (!slides.length) return
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

  const displaySlides = slides.length ? slides : FALLBACK_SLIDES

  return (
    <section className='relative h-[420px] w-full overflow-hidden shadow-lg shadow-slate-200/50 rounded-2xl'>
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
          <Image
            src={displaySlides[currentIndex % displaySlides.length].image}
            alt={`Hero slide ${currentIndex + 1}`}
            fill
            priority={currentIndex === 0}
            className='object-cover'
            sizes='100vw'
          />
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className='absolute bottom-8 right-8 flex gap-3 z-10'>
        {displaySlides.map((_, index) => (
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
    </section>
  )
}

export default Hero
