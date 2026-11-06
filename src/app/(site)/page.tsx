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

export const revalidate = 60

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} | Retreats, Mass intentions & giving` },
  description: siteConfig.description,
}

export default async function Home() {
  const [slides, retreats, patrons, testimonials, gallery] = await Promise.all([
    getHeroSlides(),
    getHomepageRetreats(3),
    getPatrons(),
    getTestimonials(),
    getGalleryPreview(5),
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
