'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

import { useT } from '@/i18n/client'

export default function ScrollToTop() {
  const t = useT()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 600)
    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  if (!isVisible) return null

  return (
    <button
      type='button'
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('common.a11y.backToTop')}
      className='fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-gold-200 shadow-lift transition hover:-translate-y-0.5 hover:bg-navy-700'
    >
      <ArrowUp className='h-5 w-5' />
    </button>
  )
}
