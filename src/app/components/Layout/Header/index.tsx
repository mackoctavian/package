'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Logo from './Logo'
import HeaderLink from '../Header/Navigation/HeaderLink'
import MobileHeaderLink from '../Header/Navigation/MobileHeaderLink'
import { Icon } from '@iconify/react/dist/iconify.js'
import { HeaderItem } from '@/app/types/menu'
import { Phone, Mail, Facebook, Instagram, Youtube, ChevronDown, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Header: React.FC = () => {
  const [headerData, setHeaderData] = useState<HeaderItem[]>([])
  const [navbarOpen, setNavbarOpen] = useState(false)
  const [language, setLanguage] = useState<'EN' | 'SW'>('EN')
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<HeaderItem | null>(null)

  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const langDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/data')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setHeaderData(data.HeaderData)
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }
    fetchData()
  }, [])

  const handleClickOutside = (event: MouseEvent) => {
    if (
      mobileMenuRef.current &&
      !mobileMenuRef.current.contains(event.target as Node) &&
      navbarOpen
    ) {
      setNavbarOpen(false)
    }
    if (
      langDropdownRef.current &&
      !langDropdownRef.current.contains(event.target as Node) &&
      langDropdownOpen
    ) {
      setLangDropdownOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [navbarOpen, langDropdownOpen])

  const handleHover = (item: HeaderItem | null) => {
    if (item?.submenu) {
      setActiveItem(item)
    } else {
      setActiveItem(null)
    }
  }

  return (
    <header 
      className='fixed top-0 z-40 w-full'
      onMouseLeave={() => setActiveItem(null)}
    >
      {/* Top Bar */}
      <div className='bg-slate-900 text-white'>
        <div className='w-full px-2 sm:px-4 lg:px-6'>
          <div className='flex items-center justify-between py-2'>
            {/* Left: Contact Info */}
            <div className='hidden md:flex items-center gap-6 text-sm'>
              <a href='tel:+255765572679' className='flex items-center gap-2 text-slate-300 hover:text-white transition-colors'>
                <Phone className='w-3.5 h-3.5' />
                <span>+255 765 572 679</span>
              </a>
              <a href='mailto:dmrc.vikindu@gmail.com' className='flex items-center gap-2 text-slate-300 hover:text-white transition-colors'>
                <Mail className='w-3.5 h-3.5' />
                <span>dmrc.vikindu@gmail.com</span>
              </a>
            </div>

            {/* Right: Social Links & Language */}
            <div className='flex items-center gap-4 ml-auto'>
              {/* Social Links */}
              <div className='flex items-center gap-1'>
                <a
                  href='https://facebook.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all'
                  aria-label='Facebook'
                >
                  <Facebook className='w-4 h-4' />
                </a>
                <a
                  href='https://instagram.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all'
                  aria-label='Instagram'
                >
                  <Instagram className='w-4 h-4' />
                </a>
                <a
                  href='https://youtube.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all'
                  aria-label='YouTube'
                >
                  <Youtube className='w-4 h-4' />
                </a>
              </div>

              {/* Divider */}
              <div className='w-px h-4 bg-slate-700' />

              {/* Language Switcher */}
              <div className='relative' ref={langDropdownRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className='flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all'
                >
                  <Globe className='w-3.5 h-3.5' />
                  <span>{language === 'EN' ? 'English' : 'Kiswahili'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className='absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50'
                    >
                      <button
                        onClick={() => {
                          setLanguage('EN')
                          setLangDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                          language === 'EN'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        🇬🇧 English
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('SW')
                          setLangDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                          language === 'SW'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        🇹🇿 Kiswahili
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className='bg-white shadow-sm relative z-20'>
        <div className='w-full px-2 sm:px-4 lg:px-6 py-4 flex items-center justify-between'>
          <Logo />
          <nav className='hidden lg:flex grow items-center gap-8 justify-start ml-14 text-slate-900 h-full'>
            {headerData.map((item, index) => (
              <HeaderLink 
                key={index} 
                item={item} 
                isSticky 
                onHover={handleHover}
              />
            ))}
          </nav>
          <div className='flex items-center gap-4'>
            <Link
              href='/retreats'
              className='hidden lg:inline-flex bg-primary text-white text-base font-medium hover:bg-transparent hover:text-primary border border-primary px-6 py-2 rounded-lg transition duration-300'>
              Book Retreat
            </Link>
            <Link
              href='/retreats/check-booking'
              className='hidden lg:inline-flex border border-slate-200 text-base font-medium text-slate-900 px-5 py-2 rounded-lg transition duration-300 hover:border-primary/50 hover:text-primary'>
              Check Booking
            </Link>
            <button
              onClick={() => setNavbarOpen(!navbarOpen)}
              className='block lg:hidden p-2 rounded-lg'
              aria-label='Toggle mobile menu'>
              <span className='block w-6 h-0.5 transition-colors duration-200 bg-slate-900'></span>
              <span className='block w-6 h-0.5 mt-1.5 transition-colors duration-200 bg-slate-900'></span>
              <span className='block w-6 h-0.5 mt-1.5 transition-colors duration-200 bg-slate-900'></span>
            </button>
          </div>
        </div>
      </div>

      {/* Mega Menu Slider */}
      <AnimatePresence>
        {activeItem?.submenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='absolute top-full left-0 w-full bg-white border-t border-slate-100 shadow-lg z-50 overflow-hidden'
            onMouseEnter={() => setActiveItem(activeItem)}
          >
            <div className='w-full px-2 sm:px-4 lg:px-6 py-8'>
              <div className='grid grid-cols-12 gap-8'>
                <div className='col-span-12 lg:col-span-3'>
                  <h3 className='text-lg font-bold text-slate-900 mb-4'>{activeItem.label}</h3>
                  <p className='text-sm text-slate-500 leading-relaxed'>
                    Explore our {activeItem.label.toLowerCase()} and discover the spiritual journey that awaits you at Divine Mercy Retreat Center.
                  </p>
                </div>
                <div className='col-span-12 lg:col-span-9'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                    {activeItem.submenu.map((subItem, index) => (
                      <Link
                        key={index}
                        href={subItem.href}
                        onClick={() => setActiveItem(null)}
                        className='group flex flex-col gap-1 p-4 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all'
                      >
                        <span className='text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors'>
                          {subItem.label}
                        </span>
                        <span className='text-xs text-slate-500 group-hover:text-slate-600'>
                          Learn more →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      {navbarOpen && (
        <div className='fixed top-0 left-0 w-full h-full bg-black/50 z-40' />
      )}

      {/* Mobile Menu Drawer */}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed top-0 right-0 h-full w-full bg-white shadow-lg transform transition-transform duration-300 max-w-xs ${
          navbarOpen ? 'translate-x-0' : 'translate-x-full'
        } z-50`}>
        <div className='flex items-center justify-between p-4 border-b border-slate-100'>
          <Logo />
          <button
            onClick={() => setNavbarOpen(false)}
            className='p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors'
            aria-label='Close menu'>
            <Icon icon={'material-symbols:close-rounded'} width={20} height={20} />
          </button>
        </div>

        <nav className='flex flex-col p-4'>
          {headerData.map((item, index) => (
            <MobileHeaderLink key={index} item={item} />
          ))}

          {/* Language Switcher in Mobile */}
          <div className='mt-6 pt-6 border-t border-slate-100'>
            <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3'>Language</p>
            <div className='flex gap-2'>
              <button
                onClick={() => setLanguage('EN')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  language === 'EN'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => setLanguage('SW')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  language === 'SW'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🇹🇿 Kiswahili
              </button>
            </div>
          </div>

          {/* Contact Info in Mobile */}
          <div className='mt-6 pt-6 border-t border-slate-100 space-y-3'>
            <a href='tel:+255765572679' className='flex items-center gap-3 text-sm text-slate-600'>
              <Phone className='w-4 h-4 text-blue-600' />
              +255 765 572 679
            </a>
            <a href='mailto:dmrc.vikindu@gmail.com' className='flex items-center gap-3 text-sm text-slate-600'>
              <Mail className='w-4 h-4 text-blue-600' />
              dmrc.vikindu@gmail.com
            </a>
          </div>

          {/* Social Links in Mobile */}
          <div className='mt-6 flex gap-3'>
            <a href='https://facebook.com' className='p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors'>
              <Facebook className='w-5 h-5' />
            </a>
            <a href='https://instagram.com' className='p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-pink-600 hover:text-white transition-colors'>
              <Instagram className='w-5 h-5' />
            </a>
            <a href='https://youtube.com' className='p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white transition-colors'>
              <Youtube className='w-5 h-5' />
            </a>
          </div>

          <Link
            href='/retreats'
            onClick={() => setNavbarOpen(false)}
            className='mt-6 w-full text-center bg-primary text-white px-4 py-3 rounded-lg border border-primary hover:text-primary hover:bg-transparent transition duration-300 ease-in-out'>
            Book Retreat
          </Link>
          <Link
            href='/retreats/check-booking'
            onClick={() => setNavbarOpen(false)}
            className='mt-3 w-full text-center border border-slate-200 px-4 py-3 rounded-lg text-slate-900 hover:border-primary/40 hover:text-primary transition duration-300 ease-in-out'>
            Check Booking
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
