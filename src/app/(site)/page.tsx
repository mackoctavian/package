import React from 'react'
import Hero from '@/app/components/Home/Hero'
import ImageCardMenu from '@/app/components/Home/ImageCardMenu'
import NamesList from '@/app/components/Home/Courses'
import Mentor from '@/app/components/Home/Mentor'
import Gallery from '@/app/components/Home/Gallery'
import Testimonial from '@/app/components/Home/Testimonial'
import { Metadata } from 'next'
import ContactForm from '@/app/components/Contact/Form'

export const metadata: Metadata = {
  title: 'Divine Mercy Retreat Center | DMRC',
  description: 'Divine Mercy Retreat Center (DMRC) Vikindu - A sanctuary of peace and prayer in Tanzania, East Africa.',
}

export default function Home() {
  return (
    <>
      <Hero />
      <ImageCardMenu />
      <NamesList />
      <Mentor />
      <Gallery />
      <Testimonial />
      <ContactForm />
    </>
  )
}
