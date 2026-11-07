import type { Metadata } from 'next'

import HeroSection from '@/app/components/site/home/HeroSection'
import ContactSection from '@/app/components/site/home/ContactSection'
import {
  BookingStepsSection,
  GalleryPreviewSection,
  MassAndGivingSection,
  PatronsSection,
  RetreatsSection,
  TestimonialsSection,
  WelcomeSection,
} from '@/app/components/site/home/HomeSections'
import { getGalleryPreview, getHeroSlides, getHomepageRetreats, getPatrons, getTestimonials } from '@/lib/site/homepage'
import { siteConfig } from '@/app/data/site'
import { getT, setRequestLocale } from '@/i18n/server'
import { pageMetadata, resolveLocale, type LocaleParams } from '@/i18n/page'

export const revalidate = 60

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getT(locale)
  return pageMetadata(locale, '/', {
    title: { absolute: `${siteConfig.name} | ${t('meta.homeTitle')}` },
    description: t('meta.siteDescription'),
  })
}

export default async function Home({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  setRequestLocale(locale)
  const [slides, retreats, patrons, testimonials, gallery] = await Promise.all([
    getHeroSlides(locale),
    getHomepageRetreats(locale, 3),
    getPatrons(locale),
    getTestimonials(locale),
    getGalleryPreview(locale, 5),
  ])

  return (
    <main>
      <HeroSection slides={slides} />
      <WelcomeSection />
      <RetreatsSection retreats={retreats} />
      <BookingStepsSection />
      <MassAndGivingSection />
      <PatronsSection patrons={patrons} />
      <TestimonialsSection testimonials={testimonials} />
      <GalleryPreviewSection items={gallery} />
      <ContactSection />
    </main>
  )
}
