'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Calendar, Heart, Star, ChevronDown, 
  Filter, Grid3X3, List, X, Plus, Minus, Trash2,
  MapPin, Users, Clock, ArrowRight, Check, Sparkles,
  User, UserCheck
} from 'lucide-react'

import type { RetreatType, RetreatCategory } from '@/app/types/retreat'

import { Home, Church, Flame } from 'lucide-react'

const categoryConfig: Record<Exclude<RetreatCategory, 'all'>, { label: string; icon: typeof Users; color: string }> = {
  residential: { label: 'Residential Retreat', icon: Home, color: 'bg-violet-500' },
  parish: { label: 'Parish Retreats', icon: Church, color: 'bg-blue-500' },
  special: { label: 'Special Retreats', icon: Sparkles, color: 'bg-emerald-500' },
  'jesus-mission': { label: 'Jesus Mission Retreats', icon: Flame, color: 'bg-amber-500' },
}

const statusStyles: Record<RetreatType['status'], { bg: string; text: string }> = {
  'Registration Open': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Waitlist: { bg: 'bg-amber-50', text: 'text-amber-700' },
  Closed: { bg: 'bg-slate-100', text: 'text-slate-500' },
}

const validCategories: Exclude<RetreatCategory, 'all'>[] = ['residential', 'parish', 'special', 'jesus-mission']

const tzsFormatter = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

type CartEntry = { retreat: RetreatType; attendees: { male: number; female: number } }
type ViewMode = 'grid' | 'list'
type SortOption = 'date' | 'price-low' | 'price-high' | 'availability' | 'popular'

const fetchRetreats = async (): Promise<RetreatType[]> => {
  const res = await fetch('/api/retreats', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to load retreats')
  }
  const data = await res.json()
  return data.data ?? []
}

const RetreatsPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const categoryParam = searchParams.get('category')
  const initialCategory: 'All' | Exclude<RetreatCategory, 'all'> = 
    categoryParam && validCategories.includes(categoryParam as Exclude<RetreatCategory, 'all'>)
      ? (categoryParam as Exclude<RetreatCategory, 'all'>)
      : 'All'

  const [category, setCategory] = useState<'All' | Exclude<RetreatCategory, 'all'>>(initialCategory)
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<Record<string, { male: number; female: number }>>({})
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [cartOpen, setCartOpen] = useState(false)

  const {
    data: retreats = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['retreats'],
    queryFn: fetchRetreats,
    staleTime: 1000 * 60,
  })

  // Sync category with URL
  useEffect(() => {
    if (categoryParam && validCategories.includes(categoryParam as Exclude<RetreatCategory, 'all'>)) {
      setCategory(categoryParam as Exclude<RetreatCategory, 'all'>)
    }
  }, [categoryParam])

  const handleCategoryChange = (newCategory: 'All' | Exclude<RetreatCategory, 'all'>) => {
    setCategory(newCategory)
    if (newCategory === 'All') {
      router.push('/retreats')
    } else {
      router.push(`/retreats?category=${newCategory}`)
    }
  }

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 2600)
    return () => clearTimeout(timer)
  }, [toastMessage])

  const filteredItems = useMemo(() => {
    let items = retreats.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })

    // Sort items
    switch (sortBy) {
      case 'price-low':
        items = [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        break
      case 'price-high':
        items = [...items].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        break
      case 'availability':
        items = [...items].sort((a, b) => b.availability.total - a.availability.total)
        break
      case 'popular':
        items = [...items].sort((a, b) => {
          const aPopular = a.status === 'Registration Open' ? 2 : a.status === 'Waitlist' ? 1 : 0
          const bPopular = b.status === 'Registration Open' ? 2 : b.status === 'Waitlist' ? 1 : 0
          return bPopular - aPopular
        })
        break
    }

    return items
  }, [retreats, category, searchTerm, sortBy])

  const cartItems = useMemo<CartEntry[]>(() => {
    return Object.entries(cart)
      .map(([retreatId, attendees]) => {
        const retreat = retreats.find((item) => item.id === retreatId)
        if (!retreat) return null
        return { retreat, attendees }
      })
      .filter((entry): entry is CartEntry => entry !== null)
  }, [cart, retreats])

  const totalAttendees = useMemo(() => 
    cartItems.reduce((count, entry) => count + entry.attendees.male + entry.attendees.female, 0), 
  [cartItems])
  
  const subtotal = useMemo(() => 
    cartItems.reduce((total, entry) => {
      const price = entry.retreat.price ?? 0
      const attendees = entry.attendees.male + entry.attendees.female
      return total + price * attendees
    }, 0), 
  [cartItems])

  const showToast = (message: string) => setToastMessage(message)

  const handleAddToCart = (retreat: RetreatType, gender: 'male' | 'female') => {
    if (retreat.status === 'Closed') {
      showToast('This retreat is closed for registration.')
      return
    }

    setCart((prev) => {
      const current = prev[retreat.id] ?? { male: 0, female: 0 }
      const totalCurrent = current.male + current.female
      
      if (totalCurrent >= 10) {
        showToast('Maximum 10 attendees per retreat.')
        return prev
      }

      const availableForGender = gender === 'male' ? retreat.availability.male : retreat.availability.female
      if (current[gender] >= availableForGender) {
        showToast(`No more ${gender} spots available.`)
        return prev
      }

      showToast('Added to booking!')
      return { 
        ...prev, 
        [retreat.id]: { 
          ...current, 
          [gender]: current[gender] + 1 
        } 
      }
    })
  }

  const handleDecreaseQuantity = (retreat: RetreatType, gender: 'male' | 'female') => {
    setCart((prev) => {
      const current = prev[retreat.id]
      if (!current || current[gender] === 0) return prev

      const newCount = { ...current, [gender]: current[gender] - 1 }
      
      if (newCount.male === 0 && newCount.female === 0) {
        const { [retreat.id]: _, ...rest } = prev
        return rest
      }

      return { ...prev, [retreat.id]: newCount }
    })
  }

  const handleRemoveFromCart = (retreat: RetreatType) => {
    if (!cart[retreat.id]) return
    setCart((prev) => {
      const { [retreat.id]: _, ...rest } = prev
      return rest
    })
  }

  const handleCheckout = () => {
    if (totalAttendees === 0) {
      showToast('Your booking cart is empty.')
      return
    }
    setIsCheckingOut(true)
    // Navigate to booking form or handle checkout
    setTimeout(() => {
      setIsCheckingOut(false)
      setCartOpen(false)
      // For now, navigate to the first retreat's booking page
      const firstItem = cartItems[0]
      if (firstItem) {
        router.push(firstItem.retreat.ctaHref)
      }
    }, 500)
  }

  return (
    <main className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      {/* Hero Section */}
      <section className='pt-32 pb-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[url("/images/banner/Stars.svg")] opacity-20' />
        <div className='absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent' />
        <div className='container mx-auto max-w-7xl px-4 relative'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center max-w-3xl mx-auto'
          >
            <span className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-6'>
              <Sparkles className='w-4 h-4' />
              Spiritual Encounters Await
            </span>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight'>
              Book Your Retreat
            </h1>
            <p className='text-lg text-white/70 leading-relaxed'>
              Browse our upcoming retreats, discover transformative experiences, and secure your spot 
              for moments of prayer, healing, and spiritual renewal.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='max-w-2xl mx-auto mt-8'
          >
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Search retreats by name, speaker, or location...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-all'
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className='sticky top-[88px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm'>
        <div className='container mx-auto max-w-7xl px-4'>
          {/* Category Tabs */}
          <div className='flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide'>
            <button
              onClick={() => handleCategoryChange('All')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                category === 'All'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Retreats
            </button>
            {(Object.keys(categoryConfig) as Exclude<RetreatCategory, 'all'>[]).map((cat) => {
              const config = categoryConfig[cat]
              const Icon = config.icon
              const count = retreats.filter(p => p.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    category === cat
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  {config.label}
                  <span className={`text-xs ${category === cat ? 'text-white/70' : 'text-slate-400'}`}>({count})</span>
                </button>
              )
            })}
          </div>

          {/* Results Count & Filters */}
          <div className='flex items-center justify-between py-3 border-t border-slate-100'>
            <p className='text-sm text-slate-600'>
              <span className='font-bold text-slate-900'>{filteredItems.length}</span> retreat{filteredItems.length !== 1 ? 's' : ''} available
            </p>

            <div className='flex items-center gap-3'>
              {/* Sort Dropdown */}
              <div className='relative'>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className='appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer'
                >
                  <option value='date'>Sort: Upcoming</option>
                  <option value='price-low'>Price: Low to High</option>
                  <option value='price-high'>Price: High to Low</option>
                  <option value='availability'>Most Available</option>
                  <option value='popular'>Most Popular</option>
                </select>
                <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none' />
              </div>

              {/* View Toggle */}
              <div className='flex items-center border border-slate-200 rounded-xl overflow-hidden'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid3X3 className='w-5 h-5' />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className='w-5 h-5' />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Pills */}
          {(category !== 'All' || searchTerm) && (
            <div className='flex flex-wrap items-center gap-2 pb-3'>
              {category !== 'All' && (
                <button
                  onClick={() => handleCategoryChange('All')}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-200 transition-colors'
                >
                  {categoryConfig[category].label}
                  <X className='w-3 h-3' />
                </button>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors'
                >
                  "{searchTerm}"
                  <X className='w-3 h-3' />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto max-w-7xl px-4 py-8'>
        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='bg-white rounded-3xl p-6 animate-pulse border border-slate-100'>
                <div className='h-48 bg-slate-100 rounded-2xl mb-4' />
                <div className='h-4 bg-slate-100 rounded w-3/4 mb-2' />
                <div className='h-4 bg-slate-100 rounded w-1/2 mb-4' />
                <div className='h-10 bg-slate-100 rounded-xl' />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className='flex flex-col items-center justify-center py-20 text-center'>
            <div className='w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4'>
              <X className='w-8 h-8 text-red-500' />
            </div>
            <h3 className='text-lg font-semibold text-slate-900 mb-2'>Unable to load retreats</h3>
            <p className='text-slate-500'>Please try again later.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <AnimatePresence mode='popLayout'>
              {filteredItems.map((retreat, index) => (
                <motion.div
                  key={retreat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <RetreatCard 
                    retreat={retreat} 
                    onAddToCart={handleAddToCart} 
                    cart={cart} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className='space-y-4'>
            <AnimatePresence mode='popLayout'>
              {filteredItems.map((retreat, index) => (
                <motion.div
                  key={retreat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <RetreatListItem 
                    retreat={retreat} 
                    onAddToCart={handleAddToCart} 
                    cart={cart} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredItems.length === 0 && !isLoading && (
          <div className='flex flex-col items-center justify-center py-20 text-center'>
            <div className='w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6'>
              <Search className='w-10 h-10 text-slate-300' />
            </div>
            <h3 className='text-xl font-semibold text-slate-900 mb-2'>No retreats found</h3>
            <p className='text-slate-500 max-w-md mb-6'>
              Try adjusting your search or filter to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setCategory('All')
                setSearchTerm('')
                router.push('/retreats')
              }}
              className='px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors'
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setCartOpen(true)}
        className='fixed bottom-6 right-6 z-40 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 transition-all'
      >
        <Calendar className='w-5 h-5' />
        <span className='font-semibold'>{totalAttendees} spot{totalAttendees !== 1 ? 's' : ''}</span>
        <span className='h-6 w-px bg-white/30' />
        <span className='font-bold'>{tzsFormatter.format(subtotal)}</span>
      </motion.button>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50'
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className='fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col'
            >
              <div className='flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50'>
                <div>
                  <h2 className='text-xl font-bold text-slate-900'>Booking Cart</h2>
                  <p className='text-sm text-slate-500'>{totalAttendees} attendee{totalAttendees !== 1 ? 's' : ''} selected</p>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className='p-2 rounded-xl bg-white shadow-sm hover:bg-slate-50 transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              <div className='flex-1 overflow-y-auto p-6'>
                {cartItems.length === 0 ? (
                  <div className='flex flex-col items-center justify-center h-full text-center'>
                    <div className='w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4'>
                      <Calendar className='w-10 h-10 text-slate-300' />
                    </div>
                    <h3 className='text-lg font-semibold text-slate-900 mb-2'>No bookings yet</h3>
                    <p className='text-slate-500 mb-6'>Add retreats to start your journey</p>
                    <button
                      onClick={() => setCartOpen(false)}
                      className='px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors'
                    >
                      Browse Retreats
                    </button>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {cartItems.map(({ retreat, attendees }) => (
                      <div key={retreat.id} className='bg-slate-50 rounded-2xl p-4'>
                        <div className='flex gap-4'>
                          <div className='relative w-20 h-24 rounded-xl overflow-hidden bg-white flex-shrink-0'>
                            <Image
                              src={retreat.imageSrc}
                              alt={retreat.title}
                              fill
                              className='object-cover'
                            />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h4 className='font-semibold text-slate-900 truncate'>{retreat.title}</h4>
                            <p className='text-sm text-slate-500 truncate'>{retreat.dateRange}</p>
                            <p className='font-bold text-indigo-600 mt-1'>
                              {retreat.isPaid === false ? 'Free' : tzsFormatter.format(retreat.price ?? 0)}
                              <span className='text-slate-400 font-normal'> / person</span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(retreat)}
                            className='p-2 text-slate-400 hover:text-red-500 transition-colors self-start'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>

                        {/* Attendee Controls */}
                        <div className='mt-4 space-y-3'>
                          {/* Male Attendees */}
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2 text-sm text-slate-600'>
                              <User className='w-4 h-4 text-blue-500' />
                              <span>Male</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <button
                                onClick={() => handleDecreaseQuantity(retreat, 'male')}
                                className='p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors'
                              >
                                <Minus className='w-4 h-4' />
                              </button>
                              <span className='w-8 text-center font-semibold'>{attendees.male}</span>
                              <button
                                onClick={() => handleAddToCart(retreat, 'male')}
                                className='p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors'
                              >
                                <Plus className='w-4 h-4' />
                              </button>
                            </div>
                          </div>

                          {/* Female Attendees */}
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2 text-sm text-slate-600'>
                              <User className='w-4 h-4 text-pink-500' />
                              <span>Female</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <button
                                onClick={() => handleDecreaseQuantity(retreat, 'female')}
                                className='p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors'
                              >
                                <Minus className='w-4 h-4' />
                              </button>
                              <span className='w-8 text-center font-semibold'>{attendees.female}</span>
                              <button
                                onClick={() => handleAddToCart(retreat, 'female')}
                                className='p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors'
                              >
                                <Plus className='w-4 h-4' />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className='mt-3 pt-3 border-t border-slate-200 flex justify-between text-sm'>
                          <span className='text-slate-500'>Subtotal ({attendees.male + attendees.female} spots)</span>
                          <span className='font-semibold text-slate-900'>
                            {tzsFormatter.format((retreat.price ?? 0) * (attendees.male + attendees.female))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className='p-6 border-t border-slate-100 bg-slate-50 space-y-4'>
                  <div className='flex justify-between text-lg font-bold'>
                    <span>Total</span>
                    <span className='text-indigo-600'>{tzsFormatter.format(subtotal)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className='w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2'
                  >
                    {isCheckingOut ? 'Processing...' : 'Proceed to Booking'}
                    <ArrowRight className='w-5 h-5' />
                  </button>
                  <p className='text-xs text-center text-slate-500'>
                    You'll complete registration details in the next step
                  </p>
        </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className='fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-xl'
          >
            <Check className='w-4 h-4 text-emerald-400' />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

// Retreat Card Component (Grid View)
const RetreatCard = ({ 
  retreat, 
  onAddToCart, 
  cart 
}: { 
  retreat: RetreatType
  onAddToCart: (r: RetreatType, gender: 'male' | 'female') => void
  cart: Record<string, { male: number; female: number }>
}) => {
  const cartItem = cart[retreat.id]
  const totalInCart = cartItem ? cartItem.male + cartItem.female : 0
  const status = statusStyles[retreat.status]
  const categoryInfo = retreat.category !== 'all' ? categoryConfig[retreat.category as Exclude<RetreatCategory, 'all'>] : null

  return (
    <article className='group bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-500'>
      {/* Image */}
      <div className='relative h-48 bg-slate-100 overflow-hidden'>
        <Image
          src={retreat.imageSrc}
          alt={retreat.title}
          fill
          className='object-cover transition-transform duration-700 group-hover:scale-110'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
        
        {/* Status Badge */}
        <div className='absolute top-4 left-4'>
          <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${status.bg} ${status.text}`}>
            {retreat.status}
          </span>
        </div>

        {/* Price Tag */}
        <div className='absolute top-4 right-4'>
          <span className='px-3 py-1.5 rounded-full text-sm font-bold bg-white text-slate-900 shadow-lg'>
            {retreat.isPaid === false ? 'Free' : tzsFormatter.format(retreat.price ?? 0)}
          </span>
        </div>

        {/* Bottom Info */}
        <div className='absolute bottom-4 left-4 right-4 flex items-center justify-between'>
          <div className='flex items-center gap-1.5 text-white text-xs font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full'>
            <Calendar className='w-3.5 h-3.5' />
            <span>{retreat.dateRange}</span>
          </div>
          <div className='flex items-center gap-1.5 text-white text-xs font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full'>
            <Users className='w-3.5 h-3.5' />
            <span>{retreat.availability.total} spots</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='p-5'>
        {/* Category & Speaker */}
        <div className='flex items-center gap-2 mb-3'>
          {categoryInfo && (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${categoryInfo.color} text-white`}>
              {categoryInfo.label}
            </span>
          )}
          <span className='text-xs text-slate-500'>with {retreat.speaker}</span>
        </div>

        {/* Title */}
        <Link href={retreat.detailHref}>
          <h3 className='text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2'>
            {retreat.title}
          </h3>
        </Link>

        {/* Location */}
        <div className='flex items-center gap-2 text-slate-500 text-sm mb-4'>
          <MapPin className='w-4 h-4 flex-shrink-0' />
          <span className='truncate'>{retreat.location}</span>
        </div>

        {/* Availability Info */}
        <div className='flex items-center gap-4 mb-4 text-xs'>
          <div className='flex items-center gap-1.5 text-blue-600'>
            <User className='w-3.5 h-3.5' />
            <span>{retreat.availability.male} male</span>
          </div>
          <div className='flex items-center gap-1.5 text-pink-600'>
            <User className='w-3.5 h-3.5' />
            <span>{retreat.availability.female} female</span>
          </div>
        </div>

        {/* Add to Cart Buttons */}
        {retreat.status !== 'Closed' ? (
          <div className='flex gap-2'>
            <button
              onClick={() => onAddToCart(retreat, 'male')}
              className='flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5'
            >
              <User className='w-4 h-4' />
              Add Male
            </button>
            <button
              onClick={() => onAddToCart(retreat, 'female')}
              className='flex-1 py-2.5 rounded-xl bg-pink-50 text-pink-700 text-sm font-semibold hover:bg-pink-100 transition-colors flex items-center justify-center gap-1.5'
            >
              <User className='w-4 h-4' />
              Add Female
            </button>
          </div>
        ) : (
          <div className='py-2.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-semibold text-center'>
            Registration Closed
          </div>
        )}

        <Link
          href={retreat.ctaHref}
          className={`mt-3 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            retreat.status === 'Closed'
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
              : 'bg-slate-900 text-white hover:bg-indigo-600'
          }`}
        >
          Book Now
          <ArrowRight className='w-4 h-4' />
        </Link>

        {totalInCart > 0 && (
          <div className='mt-2 py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium text-center'>
            {totalInCart} in cart
          </div>
        )}
      </div>
    </article>
  )
}

// Retreat List Item Component (List View)
const RetreatListItem = ({ 
  retreat, 
  onAddToCart, 
  cart 
}: { 
  retreat: RetreatType
  onAddToCart: (r: RetreatType, gender: 'male' | 'female') => void
  cart: Record<string, { male: number; female: number }>
}) => {
  const cartItem = cart[retreat.id]
  const totalInCart = cartItem ? cartItem.male + cartItem.female : 0
  const status = statusStyles[retreat.status]
  const categoryInfo = retreat.category !== 'all' ? categoryConfig[retreat.category as Exclude<RetreatCategory, 'all'>] : null

  return (
    <article className='flex gap-5 p-5 bg-white border border-slate-100 rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300'>
      {/* Image */}
      <div className='relative w-40 h-48 flex-shrink-0 bg-slate-100 rounded-2xl overflow-hidden'>
        <Image
          src={retreat.imageSrc}
          alt={retreat.title}
          fill
          className='object-cover'
        />
        <div className='absolute top-3 left-3'>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.text}`}>
            {retreat.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0 flex flex-col'>
        <div className='flex items-start justify-between gap-4 mb-2'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              {categoryInfo && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${categoryInfo.color} text-white`}>
                  {categoryInfo.label}
                </span>
              )}
              <span className='text-xs text-slate-500'>with {retreat.speaker}</span>
            </div>
            <Link href={retreat.detailHref}>
              <h3 className='text-xl font-bold text-slate-900 hover:text-indigo-600 transition-colors'>
                {retreat.title}
              </h3>
            </Link>
          </div>
          <div className='text-right flex-shrink-0'>
            <p className='text-2xl font-bold text-indigo-600'>
              {retreat.isPaid === false ? 'Free' : tzsFormatter.format(retreat.price ?? 0)}
            </p>
            <p className='text-xs text-slate-400'>per person</p>
          </div>
        </div>

        <p className='text-sm text-slate-600 line-clamp-2 mb-3'>{retreat.description}</p>

        {/* Meta Info */}
        <div className='flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4'>
          <div className='flex items-center gap-1.5'>
            <Calendar className='w-4 h-4' />
            <span>{retreat.dateRange}</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <MapPin className='w-4 h-4' />
            <span>{retreat.location}</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <Users className='w-4 h-4' />
            <span>{retreat.availability.total} spots total</span>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-3 mt-auto flex-wrap'>
          {retreat.status !== 'Closed' ? (
            <>
              <button
                onClick={() => onAddToCart(retreat, 'male')}
                className='px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5'
              >
                <User className='w-4 h-4' />
                Add Male ({retreat.availability.male})
              </button>
              <button
                onClick={() => onAddToCart(retreat, 'female')}
                className='px-4 py-2.5 rounded-xl bg-pink-50 text-pink-700 text-sm font-semibold hover:bg-pink-100 transition-colors flex items-center gap-1.5'
              >
                <User className='w-4 h-4' />
                Add Female ({retreat.availability.female})
              </button>
            </>
          ) : (
            <span className='px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-semibold'>
              Registration Closed
            </span>
          )}

          <Link
            href={retreat.ctaHref}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 ${
              retreat.status === 'Closed'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                : 'bg-slate-900 text-white hover:bg-indigo-600 transition-colors'
            }`}
          >
            Book Now
            <ArrowRight className='w-4 h-4' />
          </Link>
          
          <Link
            href={retreat.detailHref}
            className='px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-1.5'
          >
            View Details
            <ArrowRight className='w-4 h-4' />
          </Link>

          {totalInCart > 0 && (
            <span className='px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold'>
              {totalInCart} in cart
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export default RetreatsPage
