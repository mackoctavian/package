'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useEffect, useState } from 'react'
import { FooterLinkType } from '@/app/types/footerlinks'
import { Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react'

const Footer = () => {
  const [footerlink, SetFooterlink] = useState<FooterLinkType[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/data')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        SetFooterlink(data.FooterLinkData)
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }
    fetchData()
  }, [])

  return (
    <footer className='bg-slate-900 text-white'>
      {/* Main Footer Content */}
      <div className='container mx-auto pt-20 pb-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8'>
          
          {/* Brand Column */}
          <div className='lg:col-span-4 space-y-6'>
            <Link href='/' className='inline-block'>
              <Image
                src='/images/logo/dmrc.svg'
                alt='DMRC logo'
                width={56}
                height={72}
                className='brightness-0 invert'
              />
            </Link>
            <p className='text-slate-400 leading-relaxed max-w-sm'>
              Journey with Divine Mercy Retreat Center as we accompany families, clergy, and ministries in prayer, formation, and mission.
            </p>
            
            {/* Social Links */}
            <div className='flex gap-3'>
              {[
                { icon: 'tabler:brand-facebook', href: 'https://facebook.com', label: 'Facebook' },
                { icon: 'tabler:brand-instagram', href: 'https://instagram.com', label: 'Instagram' },
                { icon: 'tabler:brand-youtube-filled', href: 'https://youtube.com', label: 'YouTube' },
                { icon: 'tabler:brand-x', href: 'https://x.com', label: 'X' },
              ].map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className='p-2.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300'
                >
                  <Icon icon={social.icon} className='text-lg' />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className='lg:col-span-4'>
            <div className='grid grid-cols-2 gap-8'>
              {footerlink.map((section, i) => (
                <div key={i}>
                  <h4 className='text-sm font-bold text-white uppercase tracking-wider mb-4'>
                    {section.section}
                  </h4>
                  <ul className='space-y-3'>
                    {section.links.map((item, j) => (
                      <li key={j}>
                        <Link
                          href={item.href}
                          className='text-slate-400 hover:text-white text-sm transition-colors duration-200 inline-flex items-center gap-1 group'
                        >
                          {item.label}
                          <ArrowUpRight className='w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all' />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Contact & Newsletter Column */}
          <div className='lg:col-span-4 space-y-8'>
            {/* Contact Info */}
            <div className='space-y-4'>
              <h4 className='text-sm font-bold text-white uppercase tracking-wider mb-4'>
                Contact Us
              </h4>
              <div className='space-y-3'>
                <a href='mailto:dmrc.vikindu@gmail.com' className='flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm'>
                  <Mail className='w-4 h-4 text-blue-400' />
                  dmrc.vikindu@gmail.com
                </a>
                <a href='tel:+255765572679' className='flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm'>
                  <Phone className='w-4 h-4 text-blue-400' />
                  +255 765 572 679
                </a>
                <a href='tel:0713840018' className='flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm'>
                  <Phone className='w-4 h-4 text-blue-400' />
                  0713 840 018
                </a>
                <div className='flex items-start gap-3 text-slate-400 text-sm'>
                  <MapPin className='w-4 h-4 text-blue-400 mt-0.5' />
                  <span>
                    Divine Mercy Retreat Center, Vikindu<br />
                    Jesus Town, Vikindu<br />
                    P.O. Box 14189, Dar es Salaam<br />
                    Tanzania, East Africa
                  </span>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className='text-sm font-bold text-white uppercase tracking-wider mb-4'>
                Stay Connected
              </h4>
              <p className='text-slate-400 text-sm mb-4'>
                Subscribe for retreat updates and spiritual reflections.
              </p>
              <form className='flex gap-2'>
                <input
                  type='email'
                  placeholder='Your email'
                  className='flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm'
                />
                <button
                  type='submit'
                  className='px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors text-sm'
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className='border-t border-slate-800'>
        <div className='container mx-auto py-6'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
            <p className='text-slate-500 text-sm'>
              © {new Date().getFullYear()} Divine Mercy Retreat Center. All rights reserved.
            </p>
            <div className='flex items-center gap-6'>
              <Link href='/privacy' className='text-slate-500 hover:text-white text-sm transition-colors'>
                Privacy Policy
              </Link>
              <Link href='/terms' className='text-slate-500 hover:text-white text-sm transition-colors'>
                Terms of Service
              </Link>
              <Link href='/about' className='text-slate-500 hover:text-white text-sm transition-colors'>
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
