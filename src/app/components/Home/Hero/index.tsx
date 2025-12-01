'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const HERO_DATA = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1743951509643-745d7a4f582f?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1744741604701-6ac1f9129c8d?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1742802390589-fcb668109b51?auto=format&fit=crop&w=1920&q=80',
  },
]

const ROTATION_INTERVAL = 6000

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % HERO_DATA.length)
    }, ROTATION_INTERVAL)

    return () => clearInterval(timer)
  }, [])

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
            src={HERO_DATA[currentIndex].image}
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
        {HERO_DATA.map((_, index) => (
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
