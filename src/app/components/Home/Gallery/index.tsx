'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { galleryHighlights, galleryCollections } from '@/app/data/gallery'

const Gallery = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  // Get all images for the gallery display
  const allImages = [
    ...galleryHighlights,
    ...galleryCollections.flatMap(c => c.items),
  ].slice(0, 8)

  const handleImageClick = (id: string, index: number) => {
    setSelectedId(id)
    setSelectedIndex(index)
  }

  const handlePrevious = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : allImages.length - 1
    setSelectedIndex(newIndex)
    setSelectedId(allImages[newIndex].id)
  }

  const handleNext = () => {
    const newIndex = selectedIndex < allImages.length - 1 ? selectedIndex + 1 : 0
    setSelectedIndex(newIndex)
    setSelectedId(allImages[newIndex].id)
  }

  const selectedImage = allImages.find(img => img.id === selectedId)

  return (
    <section id='gallery' className='py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden'>
      {/* Subtle background pattern */}
      <div className='absolute inset-0 opacity-[0.015]' style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className='container mx-auto relative'>
        
        {/* Header */}
        <div className='flex flex-col lg:flex-row items-start lg:items-end justify-between mb-16 gap-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className='max-w-xl'
          >
            <span className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-4 border border-amber-100'>
              <span className='w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse' />
              Visual Stories
            </span>
            <h2 className='text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4 tracking-tight'>
              Moments of
              <span className='block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500'>
                Faith & Community
              </span>
            </h2>
            <p className='text-lg text-slate-600 leading-relaxed'>
              A glimpse into the transformative experiences and joyful gatherings at Divine Mercy Retreat Center.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link
              href='/gallery'
              className='group inline-flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-full font-medium transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5'
            >
              Explore Gallery
              <ArrowUpRight className='w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
            </Link>
          </motion.div>
        </div>

        {/* Photo Grid - Clean Photo-Only Design */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'>
          {allImages.map((item, index) => {
            // Create varying aspect ratios for visual interest
            const isLarge = index === 0 || index === 5
            const isTall = index === 2 || index === 7

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: index * 0.03 }}
                className={`relative overflow-hidden rounded-2xl cursor-pointer group ${
                  isLarge ? 'md:col-span-2 md:row-span-2' : ''
                } ${isTall ? 'row-span-2' : ''}`}
                style={{ aspectRatio: isLarge ? '1/1' : isTall ? '3/4' : '4/3' }}
                onClick={() => handleImageClick(item.id, index)}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes='(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
                  className='object-cover transition-all duration-700 group-hover:scale-110'
                  loading='lazy'
                />
                
                {/* Subtle hover overlay - no text, just elegant darkening */}
                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500' />
                
                {/* Elegant corner accent on hover */}
                <div className='absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100'>
                  <div className='w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg'>
                    <ArrowUpRight className='w-4 h-4 text-slate-800' />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedId && selectedImage && (
            <motion.div
              className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 md:p-10'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
            >
              {/* Close Button */}
              <button
                className='absolute top-6 right-6 z-10 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors'
                onClick={() => setSelectedId(null)}
              >
                <X className='w-6 h-6' />
              </button>

              {/* Navigation */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevious() }}
                className='absolute left-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors'
              >
                <ChevronLeft className='w-6 h-6' />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                className='absolute right-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors'
              >
                <ChevronRight className='w-6 h-6' />
              </button>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className='relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl'
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  fill
                  className='object-contain bg-slate-900'
                />

                {/* Counter */}
                <div className='absolute bottom-4 left-4 px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-full text-white text-sm font-medium'>
                  {selectedIndex + 1} / {allImages.length}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default Gallery
