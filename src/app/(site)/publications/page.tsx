'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, ShoppingCart, Heart, Star, ChevronDown, 
  Filter, Grid3X3, List, X, Plus, Minus, Trash2,
  Book, Disc, Calendar, BookOpen, ArrowRight, Check
} from 'lucide-react'

import { publicationsData } from '@/app/data/publications'
import type { PublicationCategory, PublicationType } from '@/app/types/publication'

const categoryConfig: Record<PublicationCategory, { label: string; icon: typeof Book; color: string }> = {
  Bible: { label: 'Bible', icon: BookOpen, color: 'bg-amber-500' },
  Books: { label: 'Books', icon: Book, color: 'bg-blue-500' },
  CDs: { label: 'CDs', icon: Disc, color: 'bg-purple-500' },
  Calendars: { label: 'Calendars', icon: Calendar, color: 'bg-emerald-500' },
}

const validCategories: PublicationCategory[] = ['Bible', 'Books', 'CDs', 'Calendars']

const tzsFormatter = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

const toSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

type CartEntry = { product: PublicationType; quantity: number }
type ViewMode = 'grid' | 'list'
type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest' | 'rating'

const PublicationsPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const categoryParam = searchParams.get('category')
  const initialCategory: 'All' | PublicationCategory = 
    categoryParam && validCategories.includes(categoryParam as PublicationCategory)
      ? (categoryParam as PublicationCategory)
      : 'All'

  const [category, setCategory] = useState<'All' | PublicationCategory>(initialCategory)
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [showFilters, setShowFilters] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  // Sync category with URL
  useEffect(() => {
    if (categoryParam && validCategories.includes(categoryParam as PublicationCategory)) {
      setCategory(categoryParam as PublicationCategory)
    }
  }, [categoryParam])

  const handleCategoryChange = (newCategory: 'All' | PublicationCategory) => {
    setCategory(newCategory)
    if (newCategory === 'All') {
      router.push('/publications')
    } else {
      router.push(`/publications?category=${newCategory}`)
    }
  }

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 2600)
    return () => clearTimeout(timer)
  }, [toastMessage])

  const filteredItems = useMemo(() => {
    let items = publicationsData.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })

    // Sort items
    switch (sortBy) {
      case 'price-low':
        items = [...items].sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        items = [...items].sort((a, b) => b.price - a.price)
        break
      case 'newest':
        items = [...items].sort((a, b) => new Date(b.publishedOn).getTime() - new Date(a.publishedOn).getTime())
        break
      case 'rating':
        items = [...items].sort((a, b) => b.rating - a.rating)
        break
    }

    return items
  }, [category, searchTerm, sortBy])

  const cartItems = useMemo<CartEntry[]>(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = publicationsData.find((item) => item.id === productId)
        if (!product) return null
        return { product, quantity }
      })
      .filter((entry): entry is CartEntry => entry !== null)
  }, [cart])

  const itemsInCart = useMemo(() => cartItems.reduce((count, entry) => count + entry.quantity, 0), [cartItems])
  const subtotal = useMemo(() => cartItems.reduce((total, entry) => total + entry.product.price * entry.quantity, 0), [cartItems])
  const deliveryFee = subtotal > 0 ? 6000 : 0
  const total = subtotal + deliveryFee

  const showToast = (message: string) => setToastMessage(message)

  const handleAddToCart = (product: PublicationType) => {
    setCart((prev) => {
      const currentQty = prev[product.id] ?? 0
      if (currentQty >= 8) {
        showToast(`Maximum quantity reached.`)
        return prev
      }
      showToast(`Added to cart!`)
      return { ...prev, [product.id]: currentQty + 1 }
    })
  }

  const handleDecreaseQuantity = (product: PublicationType) => {
    setCart((prev) => {
      const currentQty = prev[product.id]
      if (!currentQty) return prev
      if (currentQty === 1) {
        const { [product.id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [product.id]: currentQty - 1 }
    })
  }

  const handleRemoveFromCart = (product: PublicationType) => {
    if (!cart[product.id]) return
    setCart((prev) => {
      const { [product.id]: _, ...rest } = prev
      return rest
    })
  }

  const handleCheckout = () => {
    if (itemsInCart === 0) {
      showToast('Your cart is empty.')
      return
    }
    setIsCheckingOut(true)
    setTimeout(() => {
      setIsCheckingOut(false)
      setCart({})
      setCartOpen(false)
      showToast('Order placed successfully!')
    }, 1400)
  }

  return (
    <main className='min-h-screen bg-white'>
      {/* Top Filter Bar */}
      <div className='sticky top-[88px] z-30 bg-white border-b border-slate-200'>
        <div className='container mx-auto max-w-7xl px-4'>
          {/* Category Tabs */}
          <div className='flex items-center gap-2 py-3 overflow-x-auto'>
            <button
              onClick={() => handleCategoryChange('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                category === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Listings
            </button>
            {(Object.keys(categoryConfig) as PublicationCategory[]).map((cat) => {
              const config = categoryConfig[cat]
              const Icon = config.icon
              const count = publicationsData.filter(p => p.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    category === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  {config.label}
                  <span className='text-xs opacity-70'>({count})</span>
                </button>
              )
            })}
          </div>

          {/* Results Count & Filters */}
          <div className='flex items-center justify-between py-3 border-t border-slate-100'>
            <p className='text-sm text-slate-600'>
              <span className='font-semibold text-slate-900'>{filteredItems.length.toLocaleString()}</span> results
            </p>

            <div className='flex items-center gap-3'>
              {/* Sort Dropdown */}
              <div className='relative'>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className='appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'
                >
                  <option value='featured'>Sort: Best Match</option>
                  <option value='price-low'>Price: Low to High</option>
                  <option value='price-high'>Price: High to Low</option>
                  <option value='newest'>Newest First</option>
                  <option value='rating'>Highest Rated</option>
                </select>
                <ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none' />
              </div>

              {/* View Toggle */}
              <div className='flex items-center border border-slate-200 rounded-lg overflow-hidden'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid3X3 className='w-5 h-5' />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className='w-5 h-5' />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className='flex flex-wrap items-center gap-2 pb-3'>
            {category !== 'All' && (
              <button
                onClick={() => handleCategoryChange('All')}
                className='inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium'
              >
                {category}
                <X className='w-3 h-3' />
              </button>
            )}
            <button className='inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 text-xs font-medium hover:border-slate-300'>
              <Filter className='w-3 h-3' />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto max-w-7xl px-4 py-6'>
        <div className='flex gap-8'>
          {/* Products Grid/List */}
          <div className='flex-1'>
            {viewMode === 'grid' ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
                <AnimatePresence mode='popLayout'>
                  {filteredItems.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                    >
                      <ProductCard product={product} onAddToCart={handleAddToCart} cart={cart} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className='space-y-4'>
                <AnimatePresence mode='popLayout'>
                  {filteredItems.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                    >
                      <ProductListItem product={product} onAddToCart={handleAddToCart} cart={cart} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {filteredItems.length === 0 && (
              <div className='flex flex-col items-center justify-center py-20 text-center'>
                <Search className='w-12 h-12 text-slate-300 mb-4' />
                <h3 className='text-lg font-semibold text-slate-900 mb-2'>No results found</h3>
                <p className='text-slate-500 max-w-md'>
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      <button
        onClick={() => setCartOpen(true)}
        className='fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all'
      >
        <ShoppingCart className='w-5 h-5' />
        <span className='font-semibold'>{itemsInCart} items</span>
        <span className='h-6 w-px bg-white/20' />
        <span className='font-bold'>{tzsFormatter.format(subtotal)}</span>
      </button>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className='fixed inset-0 bg-black/50 z-50'
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className='fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col'
            >
              <div className='flex items-center justify-between p-6 border-b border-slate-100'>
                <div>
                  <h2 className='text-xl font-bold text-slate-900'>Shopping Cart</h2>
                  <p className='text-sm text-slate-500'>{itemsInCart} items</p>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className='p-2 rounded-lg hover:bg-slate-100 transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              <div className='flex-1 overflow-y-auto p-6'>
                {cartItems.length === 0 ? (
                  <div className='flex flex-col items-center justify-center h-full text-center'>
                    <ShoppingCart className='w-16 h-16 text-slate-200 mb-4' />
                    <h3 className='text-lg font-semibold text-slate-900 mb-2'>Your cart is empty</h3>
                    <p className='text-slate-500 mb-6'>Add items to get started</p>
                    <button
                      onClick={() => setCartOpen(false)}
                      className='px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors'
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {cartItems.map(({ product, quantity }) => (
                      <div key={product.id} className='flex gap-4 p-4 bg-slate-50 rounded-xl'>
                        <div className='relative w-20 h-24 rounded-lg overflow-hidden bg-white'>
                          <Image
                            src={product.coverImage}
                            alt={product.title}
                            fill
                            className='object-cover'
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h4 className='font-semibold text-slate-900 truncate'>{product.title}</h4>
                          <p className='text-sm text-slate-500'>{product.author}</p>
                          <p className='font-bold text-slate-900 mt-1'>{tzsFormatter.format(product.price)}</p>
                          <div className='flex items-center gap-3 mt-2'>
                            <div className='flex items-center border border-slate-200 rounded-lg'>
                              <button
                                onClick={() => handleDecreaseQuantity(product)}
                                className='p-1.5 hover:bg-slate-100 transition-colors'
                              >
                                <Minus className='w-4 h-4' />
                              </button>
                              <span className='px-3 text-sm font-semibold'>{quantity}</span>
                              <button
                                onClick={() => handleAddToCart(product)}
                                className='p-1.5 hover:bg-slate-100 transition-colors'
                              >
                                <Plus className='w-4 h-4' />
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(product)}
                              className='p-1.5 text-slate-400 hover:text-red-500 transition-colors'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className='p-6 border-t border-slate-100 space-y-4'>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-slate-500'>Subtotal</span>
                      <span className='font-medium'>{tzsFormatter.format(subtotal)}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-slate-500'>Delivery</span>
                      <span className='font-medium'>{tzsFormatter.format(deliveryFee)}</span>
                    </div>
                    <div className='flex justify-between text-lg font-bold pt-2 border-t border-slate-100'>
                      <span>Total</span>
                      <span>{tzsFormatter.format(total)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className='w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
                  >
                    {isCheckingOut ? 'Processing...' : 'Checkout'}
                    <ArrowRight className='w-4 h-4' />
                  </button>
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
            className='fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl'
          >
            <Check className='w-4 h-4 text-emerald-400' />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

// Product Card Component (Grid View)
const ProductCard = ({ 
  product, 
  onAddToCart, 
  cart 
}: { 
  product: PublicationType
  onAddToCart: (p: PublicationType) => void
  cart: Record<string, number>
}) => {
  const quantityInCart = cart[product.id] ?? 0
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.originalPrice!) * 100) 
    : 0

  return (
    <article className='group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all'>
      {/* Image */}
      <div className='relative aspect-[3/4] bg-slate-100'>
        <Image
          src={product.coverImage}
          alt={product.title}
          fill
          className='object-cover transition-transform duration-500 group-hover:scale-105'
        />
        
        {/* Wishlist Button */}
        <button className='absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50'>
          <Heart className='w-4 h-4 text-slate-600' />
        </button>

        {/* Badges */}
        <div className='absolute top-3 left-3 flex flex-col gap-1'>
          {product.badge && (
            <span className='px-2 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wide rounded'>
              {product.badge}
            </span>
          )}
          {hasDiscount && (
            <span className='px-2 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wide rounded'>
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Sold Count */}
        {product.soldCount && product.soldCount > 500 && (
          <div className='absolute bottom-3 left-3 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded'>
            {product.soldCount.toLocaleString()} sold
          </div>
        )}
      </div>

      {/* Content */}
      <div className='p-4'>
        <Link href={`/publications/${toSlug(product.title)}`}>
          <h3 className='font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-1'>
            {product.title}
          </h3>
        </Link>
        
        <p className='text-sm text-slate-500 mb-2'>{product.format}</p>

        {/* Rating */}
        <div className='flex items-center gap-1 mb-3'>
          <Star className='w-4 h-4 text-amber-400 fill-amber-400' />
          <span className='text-sm font-medium text-slate-900'>{product.rating}</span>
          <span className='text-sm text-slate-400'>({product.totalReviews})</span>
        </div>

        {/* Price */}
        <div className='flex items-baseline gap-2 mb-3'>
          <span className='text-lg font-bold text-slate-900'>{tzsFormatter.format(product.price)}</span>
          {hasDiscount && (
            <span className='text-sm text-slate-400 line-through'>{tzsFormatter.format(product.originalPrice!)}</span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={() => onAddToCart(product)}
          className='w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2'
        >
          <ShoppingCart className='w-4 h-4' />
          {quantityInCart > 0 ? `In Cart (${quantityInCart})` : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}

// Product List Item Component (List View)
const ProductListItem = ({ 
  product, 
  onAddToCart, 
  cart 
}: { 
  product: PublicationType
  onAddToCart: (p: PublicationType) => void
  cart: Record<string, number>
}) => {
  const quantityInCart = cart[product.id] ?? 0
  const hasDiscount = product.originalPrice && product.originalPrice > product.price

  return (
    <article className='flex gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-slate-200 transition-all'>
      {/* Image */}
      <div className='relative w-28 h-36 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden'>
        <Image
          src={product.coverImage}
          alt={product.title}
          fill
          className='object-cover'
        />
        <button className='absolute top-2 right-2 p-1.5 bg-white rounded-full shadow'>
          <Heart className='w-3 h-3 text-slate-600' />
        </button>
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <Link href={`/publications/${toSlug(product.title)}`}>
              <h3 className='font-semibold text-slate-900 hover:text-blue-600 transition-colors'>
                {product.title}
              </h3>
            </Link>
            <p className='text-sm text-slate-500'>{product.format}</p>
          </div>
          {product.badge && (
            <span className='px-2 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wide rounded flex-shrink-0'>
              {product.badge}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className='flex items-center gap-1 mt-2'>
          <Star className='w-4 h-4 text-amber-400 fill-amber-400' />
          <span className='text-sm font-medium'>{product.rating}</span>
          <span className='text-sm text-slate-400'>({product.totalReviews} reviews)</span>
        </div>

        {/* Price & Actions */}
        <div className='flex items-center justify-between mt-3'>
          <div className='flex items-baseline gap-2'>
            <span className='text-xl font-bold text-slate-900'>{tzsFormatter.format(product.price)}</span>
            {hasDiscount && (
              <>
                <span className='text-sm text-slate-400 line-through'>{tzsFormatter.format(product.originalPrice!)}</span>
                <span className='text-sm text-emerald-600 font-medium'>Free shipping</span>
              </>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            className='px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2'
          >
            <ShoppingCart className='w-4 h-4' />
            {quantityInCart > 0 ? `In Cart (${quantityInCart})` : 'Add to Cart'}
          </button>
        </div>

        {product.soldCount && product.soldCount > 100 && (
          <p className='text-sm text-emerald-600 font-medium mt-2'>
            {product.soldCount.toLocaleString()} sold
          </p>
        )}
      </div>
    </article>
  )
}

export default PublicationsPage
