'use client'

import { Link, usePathnameWithoutLocale } from '@/i18n/link'
import { useT } from '@/i18n/client'
import LanguageSwitcher from '@/app/components/i18n/LanguageSwitcher'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, HeartHandshake, Mail, Menu, Phone, Ticket, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import Logo from '@/app/components/Layout/Header/Logo'
import { Button } from '@/app/components/ui/button'
import { mainNavigation, siteConfig, type NavItem } from '@/app/data/site'
import { cn } from '@/lib/utils'

const isActivePath = (pathname: string, item: NavItem) => {
  if (pathname === item.href) return true
  if (item.href !== '/' && pathname.startsWith(item.href)) return true
  return item.children?.some((child) => pathname === child.href.split('?')[0]) ?? false
}

function DesktopNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const active = isActivePath(pathname, item)

  useEffect(() => setOpen(false), [pathname])

  const linkClasses = cn(
    'relative inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors',
    active ? 'text-navy-900' : 'text-navy-700/80 hover:text-navy-900',
  )

  if (!item.children?.length) {
    return (
      <Link href={item.href} className={linkClasses} aria-current={active ? 'page' : undefined}>
        {t.dynamic(`nav.items.${item.id}.label`)}
        {active && <span className='absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-gold-400' />}
      </Link>
    )
  }

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <div
      className='relative'
      onMouseEnter={show}
      onMouseLeave={hide}
      onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
    >
      <button
        type='button'
        className={linkClasses}
        aria-expanded={open}
        aria-haspopup='true'
        onClick={() => setOpen((value) => !value)}
      >
        {t.dynamic(`nav.items.${item.id}.label`)}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
        {active && <span className='absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-gold-400' />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className='absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-3'
          >
            <div className='overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-lift'>
              {item.children.map((child) => (
                <Link
                  key={child.href + child.id}
                  href={child.href}
                  className='block rounded-xl px-4 py-3 transition-colors hover:bg-parchment focus-visible:bg-parchment focus-visible:outline-none'
                >
                  <span className='block text-sm font-semibold text-navy-900'>{t.dynamic(`nav.items.${child.id}.label`)}</span>
                  {child.described && (
                    <span className='mt-0.5 block text-[13px] text-muted-foreground'>{t.dynamic(`nav.items.${child.id}.description`)}</span>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileMenu({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  const t = useT()
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = original
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className='fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-sm lg:hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.nav
            aria-label={t('common.a11y.mobileNav')}
            className='fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-ivory shadow-2xl lg:hidden'
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className='flex items-center justify-between border-b border-border px-5 py-4'>
              <Logo width={110} height={40} />
              <button
                type='button'
                onClick={onClose}
                className='rounded-full p-2 text-navy-800 hover:bg-parchment'
                aria-label={t('common.a11y.closeMenu')}
              >
                <X className='h-5 w-5' />
              </button>
            </div>
            <div className='flex-1 overflow-y-auto px-3 py-4'>
              <Link
                href='/'
                className={cn(
                  'block rounded-xl px-4 py-3 text-base font-medium',
                  pathname === '/' ? 'bg-parchment text-navy-900' : 'text-navy-800',
                )}
              >
                {t('nav.home')}
              </Link>
              {mainNavigation.map((item) =>
                item.children?.length ? (
                  <div key={item.id}>
                    <button
                      type='button'
                      onClick={() => setExpanded((value) => (value === item.id ? null : item.id))}
                      className='flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-medium text-navy-800'
                      aria-expanded={expanded === item.id}
                    >
                      {t.dynamic(`nav.items.${item.id}.label`)}
                      <ChevronDown className={cn('h-4 w-4 transition-transform', expanded === item.id && 'rotate-180')} />
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className='overflow-hidden'
                        >
                          <div className='ml-4 border-l border-gold-200 py-1 pl-3'>
                            {item.children.map((child) => (
                              <Link
                                key={child.href + child.id}
                                href={child.href}
                                className='block rounded-lg px-3 py-2.5 text-[15px] text-navy-700 hover:bg-parchment'
                              >
                                {t.dynamic(`nav.items.${child.id}.label`)}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'block rounded-xl px-4 py-3 text-base font-medium',
                      isActivePath(pathname, item) ? 'bg-parchment text-navy-900' : 'text-navy-800',
                    )}
                  >
                    {t.dynamic(`nav.items.${item.id}.label`)}
                  </Link>
                ),
              )}
            </div>
            <div className='space-y-3 border-t border-border p-5'>
              <div className='flex items-center justify-between gap-3 pb-1'>
                <span className='text-sm font-medium text-navy-700'>{t('common.language.label')}</span>
                <LanguageSwitcher variant='segmented' />
              </div>
              <Button asChild size='xl' className='w-full'>
                <Link href='/retreats'>
                  <Ticket className='mr-2 h-4 w-4' /> {t('common.actions.bookRetreat')}
                </Link>
              </Button>
              <Button asChild size='xl' variant='gold' className='w-full'>
                <Link href='/donation'>
                  <HeartHandshake className='mr-2 h-4 w-4' /> {t('common.actions.giveOnline')}
                </Link>
              </Button>
              <a href={siteConfig.contact.phoneHref} className='flex items-center justify-center gap-2 pt-1 text-sm text-muted-foreground'>
                <Phone className='h-4 w-4' /> {siteConfig.contact.phone}
              </a>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}

export default function SiteHeader() {
  const t = useT()
  const pathname = usePathnameWithoutLocale()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => setMobileOpen(false), [pathname])

  return (
    <>
      <a
        href='#main-content'
        className='sr-only z-[60] rounded-md bg-navy-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4'
      >
        {t('common.a11y.skipToContent')}
      </a>
      <div className='hidden bg-navy-900 text-navy-100 md:block'>
        <div className='container flex h-10 items-center justify-between text-[13px]'>
          <p className='font-display text-[15px] italic text-gold-200'>{t('common.motto')}</p>
          <div className='flex items-center gap-6'>
            <a href={siteConfig.contact.phoneHref} className='flex items-center gap-2 hover:text-white'>
              <Phone className='h-3.5 w-3.5' /> {siteConfig.contact.phone}
            </a>
            <a href={`mailto:${siteConfig.contact.email}`} className='flex items-center gap-2 hover:text-white'>
              <Mail className='h-3.5 w-3.5' /> {siteConfig.contact.email}
            </a>
            <Link href='/retreats/check-booking' className='flex items-center gap-2 font-medium text-gold-200 hover:text-white'>
              <Ticket className='h-3.5 w-3.5' /> {t('common.actions.manageBooking')}
            </Link>
            <LanguageSwitcher variant='topbar' />
          </div>
        </div>
      </div>
      <header
        className={cn(
          'sticky top-0 z-40 w-full border-b transition-all duration-300',
          scrolled ? 'border-border bg-ivory/90 shadow-soft backdrop-blur-xl' : 'border-transparent bg-ivory',
        )}
      >
        <div className='container flex h-[72px] items-center justify-between gap-6'>
          <Logo width={120} height={44} />
          <nav aria-label={t('common.a11y.mainNav')} className='hidden items-center gap-1 lg:flex'>
            {mainNavigation.map((item) => (
              <DesktopNavItem key={item.id} item={item} pathname={pathname} />
            ))}
          </nav>
          <div className='flex items-center gap-2'>
            <LanguageSwitcher className='md:hidden' />
            <Button asChild variant='outline' size='pill' className='hidden border-navy-200 bg-transparent sm:inline-flex'>
              <Link href='/donation'>
                <HeartHandshake className='mr-1.5 h-4 w-4 text-gold-500' /> {t('common.actions.give')}
              </Link>
            </Button>
            <Button asChild size='pill' className='hidden sm:inline-flex'>
              <Link href='/retreats'>{t('common.actions.bookRetreat')}</Link>
            </Button>
            <button
              type='button'
              onClick={() => setMobileOpen(true)}
              className='rounded-full p-2.5 text-navy-900 hover:bg-parchment lg:hidden'
              aria-label={t('common.a11y.openMenu')}
              aria-expanded={mobileOpen}
            >
              <Menu className='h-6 w-6' />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={mobileOpen} onClose={closeMobile} pathname={pathname} />
    </>
  )
}
