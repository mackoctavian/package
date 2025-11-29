'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'

type MenuItem = {
  id: string
  title: string
  image: string
  items?: MenuItem[]
  href?: string
}

const MENU_DATA: MenuItem[] = [
  {
    id: 'retreats',
    title: 'Retreats',
    image: 'https://images.unsplash.com/photo-1520073068026-4d654e3042bc?auto=format&fit=crop&w=800&q=80',
    items: [
      {
        id: 'yoga',
        title: 'Yoga Retreats',
        image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
        href: '/retreats/yoga',
      },
      {
        id: 'meditation',
        title: 'Meditation',
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
        href: '/retreats/meditation',
      },
      {
        id: 'wellness',
        title: 'Wellness',
        image: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&w=800&q=80',
        href: '/retreats/wellness',
      },
    ],
  },
  {
    id: 'news',
    title: 'Latest News',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
    items: [
      {
        id: 'updates',
        title: 'Community Updates',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
        href: '/news/updates',
      },
      {
        id: 'press',
        title: 'Press Releases',
        image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
        href: '/news/press',
      },
    ],
  },
  {
    id: 'gallery',
    title: 'Gallery',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    href: '/gallery',
  },
  {
    id: 'about',
    title: 'About Us',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
    items: [
      {
        id: 'mission',
        title: 'Our Mission',
        image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=800&q=80',
        href: '/about/mission',
      },
      {
        id: 'team',
        title: 'Our Team',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
        href: '/about/team',
      },
    ],
  },
]

const ImageCardMenu = () => {
  const [activeCategory, setActiveCategory] = useState<MenuItem | null>(null)

  const handleCategoryClick = (category: MenuItem) => {
    if (category.items) {
      setActiveCategory(category)
    }
  }

  const handleBack = () => {
    setActiveCategory(null)
  }

  return (
    <section className='py-6'>
      {/* Dynamic Header */}
      <div className='mb-8'>
        <AnimatePresence mode='wait'>
          {!activeCategory ? (
            <motion.div
              key='explore-header'
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className='flex items-center gap-3'
            >
              <div className='flex items-center gap-3'>
                <div className='w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full' />
                <h2 className='text-3xl font-bold text-slate-900'>Explore</h2>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key='category-header'
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className='flex items-center gap-4'
            >
              <motion.button
                onClick={handleBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors'
              >
                <ArrowLeft className='w-5 h-5' />
              </motion.button>
              <div className='flex items-center gap-3'>
                <div className='w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full' />
                <h2 className='text-3xl font-bold text-slate-900'>{activeCategory.title}</h2>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cards Grid */}
      <div className='relative'>
        <AnimatePresence mode='wait'>
          {!activeCategory ? (
            <motion.div
              key='main-categories'
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className='grid grid-cols-2 md:grid-cols-4 gap-4'
            >
              {MENU_DATA.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <CategoryCard
                    item={category}
                    onClick={() => (category.href ? null : handleCategoryClick(category))}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key='sub-categories'
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className='grid grid-cols-2 md:grid-cols-4 gap-4'
            >
              {activeCategory.items?.map((subItem, index) => (
                <motion.div
                  key={subItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                >
                  <CategoryCard item={subItem} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

const CategoryCard = ({ item, onClick }: { item: MenuItem; onClick?: () => void }) => {
  const CardContent = (
    <div className='group relative aspect-[4/3] w-full overflow-hidden rounded-2xl cursor-pointer bg-slate-100'>
      <Image
        src={item.image}
        alt={item.title}
        fill
        className='object-cover transition-transform duration-700 ease-out group-hover:scale-110'
      />
      {/* Gradient Overlay */}
      <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300' />
      
      {/* Content */}
      <div className='absolute inset-0 flex flex-col justify-end p-5'>
        <div className='transform transition-transform duration-300 group-hover:-translate-y-1'>
          <h3 className='text-xl font-bold text-white mb-1 drop-shadow-lg'>
            {item.title}
          </h3>
          <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0'>
            <span className='text-xs font-medium text-white/80'>
              {item.items ? `${item.items.length} options` : 'View'}
            </span>
            <ArrowUpRight className='w-3.5 h-3.5 text-white/80' />
          </div>
        </div>
      </div>

      {/* Hover Border Effect */}
      <div className='absolute inset-0 rounded-2xl border-2 border-white/0 group-hover:border-white/30 transition-colors duration-300' />
    </div>
  )

  if (item.href && !onClick) {
    return <Link href={item.href}>{CardContent}</Link>
  }

  return <div onClick={onClick}>{CardContent}</div>
}

export default ImageCardMenu
