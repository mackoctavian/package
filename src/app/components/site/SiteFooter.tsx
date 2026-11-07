import { Link } from '@/i18n/link'
import { getT } from '@/i18n/server'
import LanguageSwitcher from '@/app/components/i18n/LanguageSwitcher'
import { ArrowRight, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react'

import Logo from '@/app/components/Layout/Header/Logo'
import { footerNavigation, siteConfig } from '@/app/data/site'

const socialIcons = { facebook: Facebook, instagram: Instagram, youtube: Youtube }

export default async function SiteFooter() {
  const t = await getT()
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
            <p className='eyebrow text-gold-300'>{t('nav.footer.ctaEyebrow')}</p>
            <h2 className='mt-3 text-4xl text-white sm:text-5xl'>{t('nav.footer.ctaTitle')}</h2>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Link
              href='/retreats'
              className='inline-flex h-12 items-center gap-2 rounded-full bg-gold-400 px-7 font-medium text-navy-950 transition hover:bg-gold-300'
            >
              {t('common.actions.bookRetreat')} <ArrowRight className='h-4 w-4' />
            </Link>
            <Link
              href='/donation'
              className='inline-flex h-12 items-center rounded-full border border-white/25 px-7 font-medium text-white transition hover:bg-white/10'
            >
              {t('nav.footer.ctaSupport')}
            </Link>
          </div>
        </div>
      </div>

      <div className='container relative grid gap-12 py-14 lg:grid-cols-12'>
        <div className='space-y-5 lg:col-span-4'>
          <Logo variant='inverse' width={130} height={48} />
          <p className='max-w-sm leading-relaxed text-navy-300'>
            {t('nav.footer.about', { name: siteConfig.name })}
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
            <div key={section.id}>
              <h3 className='text-xs font-semibold uppercase tracking-[0.2em] text-gold-300'>{t.dynamic(`nav.footer.${section.id}`)}</h3>
              <ul className='mt-4 space-y-3'>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className='text-[15px] text-navy-200 transition hover:text-white'>
                      {t.dynamic(`nav.items.${link.id}.label`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className='lg:col-span-4'>
          <h3 className='text-xs font-semibold uppercase tracking-[0.2em] text-gold-300'>{t('nav.footer.contact')}</h3>
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
          <div className='mt-8'>
            <h3 className='text-xs font-semibold uppercase tracking-[0.2em] text-gold-300'>{t('common.language.label')}</h3>
            <LanguageSwitcher variant='segmented' tone='dark' className='mt-4' />
          </div>
        </div>
      </div>

      <div className='border-t border-white/10'>
        <div className='container flex flex-col gap-2 py-6 text-sm text-navy-300 sm:flex-row sm:items-center sm:justify-between'>
          <p>{t('nav.footer.rights', { year: String(year), name: siteConfig.name })}</p>
          <p className='font-display text-base italic text-navy-300'>{t('common.motto')}</p>
        </div>
      </div>
    </footer>
  )
}
