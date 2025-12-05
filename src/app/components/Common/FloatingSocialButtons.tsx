'use client'

import { useState } from 'react'
import { MessageCircle, Instagram, Facebook, Youtube, X, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const FloatingSocialButtons = () => {
  const [isOpen, setIsOpen] = useState(false)

  const socialLinks = [
    {
      id: 'instagram',
      icon: Instagram,
      label: 'Instagram',
      href: 'https://www.instagram.com/dmrcvikindu/?hl=en',
      color: 'bg-pink-500 hover:bg-pink-600',
    },
    {
      id: 'facebook',
      icon: Facebook,
      label: 'Facebook',
      href: 'https://facebook.com',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'youtube',
      icon: Youtube,
      label: 'YouTube',
      href: 'https://youtube.com',
      color: 'bg-red-600 hover:bg-red-700',
    },
  ]

  return (
    <div className='fixed bottom-6 right-6 z-50 lg:hidden'>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className='mb-4 space-y-3 flex flex-col items-end'
          >
            {socialLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <motion.a
                  key={link.id}
                  href={link.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className={`${link.color} text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 group`}
                  aria-label={link.label}
                >
                  <Icon className='w-5 h-5' />
                  <span className='text-sm font-medium pr-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                    {link.label}
                  </span>
                </motion.a>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className='flex flex-col items-end gap-3'>
        {/* WhatsApp Button - Opens directly */}
        <motion.a
          href='https://wa.me/255713840018'
          target='_blank'
          rel='noopener noreferrer'
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className='bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200'
          aria-label='Contact us on WhatsApp'
        >
          <MessageCircle className='w-6 h-6' />
        </motion.a>

        {/* Expand/Collapse Button for other social icons */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`${
            isOpen ? 'bg-slate-700 hover:bg-slate-800' : 'bg-primary hover:bg-primary/90'
          } text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200`}
          aria-label={isOpen ? 'Close social menu' : 'Open social menu'}
        >
          <AnimatePresence mode='wait'>
            {isOpen ? (
              <motion.div
                key='close'
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className='w-5 h-5' />
              </motion.div>
            ) : (
              <motion.div
                key='expand'
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronUp className='w-5 h-5' />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}

export default FloatingSocialButtons

