import Link from 'next/link'
import { ArrowRight, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react'

import Logo from '@/app/components/Layout/Header/Logo'
import { footerNavigation, siteConfig } from '@/app/data/site'

const socialIcons = { facebook: Facebook, instagram: Instagram, youtube: Youtube }

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className='relative overflow-hidden bg-navy-950 text-navy-200'>
      <div
        aria-hidden
        className='pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-gold-400/10 blur-3xl'
      />

      {/* Call to action band */}
      <div className='container relative'>
        <div className='flex flex-col items-start justify-between gap-6 border-b border-white/10 py-14 md:flex-row md:items-center'>
          <div className='max-w-xl'>
            <p className='eyebrow text-gold-300'>Come and see</p>
            <h2 className='mt-3 text-4xl text-white sm:text-5xl'>Make time for God. We’ll prepare the place.</h2>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Link
              href='/retreats'
              className='inline-flex h-12 items-center gap-2 rounded-full bg-gold-400 px-7 font-medium text-navy-950 transition hover:bg-gold-300'
            >
              Book a retreat <ArrowRight className='h-4 w-4' />
            </Link>
            <Link
              href='/donation'
              className='inline-flex h-12 items-center rounded-full border border-white/25 px-7 font-medium text-white transition hover:bg-white/10'
            >
              Support our mission
            </Link>
          </div>
        </div>
      </div>

      <div className='container relative grid gap-12 py-14 lg:grid-cols-12'>
        <div className='space-y-5 lg:col-span-4'>
          <Logo variant='inverse' width={130} height={48} />
          <p className='max-w-sm leading-relaxed text-navy-300'>
            {siteConfig.name} accompanies families, clergy, religious and parishes in prayer, healing and mission.
          </p>
          <div className='flex gap-2'>
            {siteConfig.social.map((social) => {
              const Icon = socialIcons[social.icon]
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={social.label}
                  className='rounded-full border border-white/10 p-2.5 text-navy-200 transition hover:border-gold-300 hover:text-gold-200'
                >
                  <Icon className='h-4 w-4' />
                </a>
              )
            })}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-8 lg:col-span-4'>
          {footerNavigation.map((section) => (
            <div key={section.title}>
              <h3 className='text-xs font-semibold uppercase tracking-[0.2em] text-gold-300'>{section.title}</h3>
              <ul className='mt-4 space-y-3'>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className='text-[15px] text-navy-200 transition hover:text-white'>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className='lg:col-span-4'>
          <h3 className='text-xs font-semibold uppercase tracking-[0.2em] text-gold-300'>Contact</h3>
          <ul className='mt-4 space-y-4 text-[15px]'>
            <li>
              <a href={siteConfig.contact.mapsHref} target='_blank' rel='noopener noreferrer' className='flex gap-3 hover:text-white'>
                <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-gold-300' /> {siteConfig.contact.address}
              </a>
            </li>
            <li>
              <a href={siteConfig.contact.phoneHref} className='flex gap-3 hover:text-white'>
                <Phone className='mt-0.5 h-4 w-4 shrink-0 text-gold-300' /> {siteConfig.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className='flex gap-3 hover:text-white'>
                <Mail className='mt-0.5 h-4 w-4 shrink-0 text-gold-300' /> {siteConfig.contact.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className='border-t border-white/10'>
        <div className='container flex flex-col gap-2 py-6 text-sm text-navy-400 sm:flex-row sm:items-center sm:justify-between'>
          <p>
            © {year} {siteConfig.name}, Vikindu. All rights reserved.
          </p>
          <p className='font-display text-base italic text-navy-300'>“Jesus, I trust in You.”</p>
        </div>
      </div>
    </footer>
  )
}
