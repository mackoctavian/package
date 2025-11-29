'use client'
import { useState } from 'react'
import Link from 'next/link'
import { HeaderItem } from '../../../../types/menu'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const HeaderLink: React.FC<{ item: HeaderItem; isSticky?: boolean }> = ({
  item,
  isSticky = false,
}) => {
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const path = usePathname()

  return (
    <div
      className='relative group'
      onMouseEnter={() => setSubmenuOpen(true)}
      onMouseLeave={() => setSubmenuOpen(false)}>
      <Link
        href={item.href}
        className={`flex items-center gap-1 text-[15px] font-medium transition-colors duration-200 py-2 ${
          path === item.href
            ? 'text-primary'
            : 'text-slate-700 hover:text-primary'
        }`}>
        {item.label}
        {item.submenu && (
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${submenuOpen ? 'rotate-180' : ''}`} />
        )}
      </Link>

      <AnimatePresence>
        {item.submenu && submenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='absolute left-0 top-full pt-2 z-50 w-56'>
            <div className='bg-white rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden p-2'>
              {item.submenu.map((subItem, index) => (
                <Link
                  key={index}
                  href={subItem.href}
                  className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    path === subItem.href
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                  }`}>
                  {subItem.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HeaderLink
