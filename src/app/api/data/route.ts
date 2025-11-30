import { NextResponse } from 'next/server'

import { HeaderItem } from '@/app/types/menu'
import { CourseType } from '@/app/types/course'
import { Hourtype } from '@/app/types/hour'
import { MentorType } from '@/app/types/mentor'
import { TestimonialType } from '@/app/types/testimonial'
import { FooterLinkType } from '@/app/types/footerlinks'
import { retreatData } from '@/app/data/retreats'

const HeaderData: HeaderItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Retreats', href: '/retreats' },
  {
    label: 'Publications',
    href: '/publications',
    submenu: [
      { label: 'All Listings', href: '/publications' },
      { label: 'Bible', href: '/publications?category=Bible' },
      { label: 'Books', href: '/publications?category=Books' },
      { label: 'CDs', href: '/publications?category=CDs' },
      { label: 'Calendars', href: '/publications?category=Calendars' },
    ],
  },
  { label: 'Gallery', href: '/gallery' },
  { label: 'About', href: '/about' },
  { label: 'News', href: '/news' },
  { label: 'Donation', href: '/donation' },
  {
    label: 'Ministries',
    href: '/ministries',
    submenu: [
      { label: 'All Ministries', href: '/ministries' },
      { label: 'Residential Retreats', href: '/ministries/residential-retreats' },
      { label: 'Saturday Service', href: '/ministries/saturday-service' },
      { label: 'Special Retreats', href: '/ministries/special-retreats' },
      { label: 'Bible Convention', href: '/ministries/bible-convention' },
      { label: 'Bible Children', href: '/ministries/bible-children' },
      { label: 'Spiritual Counselling', href: '/ministries/spiritual-counselling' },
      { label: 'Parish Retreat', href: '/ministries/parish-retreat' },
      { label: 'Jesus Mission Retreat', href: '/ministries/jesus-mission-retreat' },
      { label: 'Team Members Ministries', href: '/ministries/team-members-ministries' },
      { label: 'Spiritual Partners', href: '/ministries/spiritual-partners' },
      { label: 'DMRC Benefactors', href: '/ministries/dmrc-benefactors' },
      { label: 'Media Ministries', href: '/ministries/media-ministries' },
      { label: 'Religious Article', href: '/ministries/religious-article' },
    ],
  },
]

const CourseData: CourseType[] = [
  { name: 'Mobile Development' },
  { name: 'Web Development' },
  { name: 'Data Science' },
  { name: 'Cloud Computing' },
]

const HourData: Hourtype[] = [
  { name: '20hrs in a Month' },
  { name: '30hrs in a Month' },
  { name: '40hrs in a Month' },
  { name: '50hrs in a Month' },
]

const Companiesdata: {
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
}[] = [
  {
    title: 'Parish Mission Week',
    description: 'Twelve missionaries head to Sacred Heart Parish for Eucharistic Adoration, street evangelisation, and family workshops.',
    ctaLabel: 'Mission Details',
    ctaHref: '/events/mission-outreach-retreat',
  },
  {
    title: 'Night of Intercession',
    description: 'Join our diocesan prayer vigil this Friday. Confessions, Taizé worship, and healing prayer teams from 7PM to midnight.',
    ctaLabel: 'Reserve a Seat',
    ctaHref: '/#retreat-booking',
  },
  {
    title: 'Youth Leadership Summit',
    description: 'Formation day for teen leaders with Fr. Christo & media ministry creatives. Breakout tracks on discipleship and media.',
    ctaLabel: 'Register Youth Team',
    ctaHref: '/events/youth-revival-retreat',
  },
  {
    title: 'Pastoral Letter Released',
    description: 'Bishop Thomas shares a pastoral letter on Eucharistic renewal. Read and pray through the guided reflections.',
    ctaLabel: 'Read Letter',
    ctaHref: '/publications',
  },
  {
    title: 'Family Healing Retreat',
    description: 'Limited seats remaining for the Holy Family Retreat. Inner healing, reconciliation services, and children’s catechesis.',
    ctaLabel: 'Secure Your Place',
    ctaHref: '/events/holy-family-retreat',
  },
  {
    title: 'Volunteer Orientation',
    description: 'Serve with hospitality, intercession, or music ministry. Mandatory session next Sunday after the 10AM Mass.',
    ctaLabel: 'Volunteer Sign-up',
    ctaHref: '/#volunteer',
  },
]

const MentorData: MentorType[] = [
  {
    name: 'Sr. Tamara Govedarovic',
    title: 'Patroness of Formation',
    imageSrc: '/images/patrons/tamara-govedarovic-TZ312UVgSIc-unsplash.jpg',
    imageAlt: 'Portrait of Sr. Tamara Govedarovic',
    role: 'Guides the ongoing formation of families and youth leaders.',
  },
  {
    name: 'Rev. Julia Michelle',
    title: 'Pastoral Counsellor',
    imageSrc: '/images/patrons/julia-michelle-nDU6x8Qevow-unsplash.jpg',
    imageAlt: 'Portrait of Rev. Julia Michelle',
    role: 'Provides pastoral care and spiritual accompaniment for retreatants.',
  },
  {
    name: 'Fr. David M. Thomas',
    title: 'Mission Director',
    imageSrc: '/images/patrons/dm-david-Yv40MTMKrAs-unsplash.jpg',
    imageAlt: 'Portrait of Fr. David M. Thomas',
    role: 'Oversees regional missions and supports parish outreach teams.',
  },
]

const TestimonialData: TestimonialType[] = [
  {
    profession: 'UX/UI Designer',
    name: 'Andrew Williams',
    imgSrc: '/images/testimonial/user-1.jpg',
    starimg: '/images/testimonial/stars.png',
    detail:
      "I have been a Junior Graphic Designer for more then 10 years. Some things are problem that I had and teach how to solve them. That's why this course is so great!",
  },
  {
    profession: 'UX/UI Designer',
    name: 'Cristian Doru Barin',
    imgSrc: '/images/testimonial/user-2.jpg',
    starimg: '/images/testimonial/stars.png',
    detail:
      "I have been a Junior Graphic Designer for more then 10 years. Some things are problem that I had and teach how to solve them. That's why this course is so great!",
  },
  {
    profession: 'UX/UI Designer',
    name: 'Tanzeel Ur Rehman',
    imgSrc: '/images/testimonial/user-3.jpg',
    starimg: '/images/testimonial/stars.png',
    detail:
      "I have been a Junior Graphic Designer for more then 10 years. Some things are problem that I had and teach how to solve them. That's why this course is so great!",
  },
  {
    profession: 'UX/UI Designer',
    name: 'Andrew Williams',
    imgSrc: '/images/testimonial/user-1.jpg',
    starimg: '/images/testimonial/stars.png',
    detail:
      "I have been a Junior Graphic Designer for more then 10 years. Some things are problem that I had and teach how to solve them. That's why this course is so great!",
  },
]

const FooterLinkData: FooterLinkType[] = [
  {
    section: 'Ministries',
    links: [
      { label: 'All Ministries', href: '/ministries' },
      { label: 'Healing & Deliverance', href: '/ministries/healing-deliverance' },
      { label: 'Youth Discipleship', href: '/ministries/youth-discipleship' },
      { label: 'Family Renewal', href: '/ministries/family-renewal' },
      { label: 'Mercy Media', href: '/ministries/mercy-media' },
      { label: 'Volunteer Teams', href: '/#volunteer' },
    ],
  },
  {
    section: 'Resources',
    links: [
      { label: 'Publications', href: '/publications' },
      { label: 'Media Gallery', href: '/gallery' },
      { label: 'News & Events', href: '/news' },
      { label: 'About DMRC', href: '/about' },
      { label: 'Support DMRC', href: '/donation' },
    ],
  },
]

export const GET = () => {
  return NextResponse.json({
    HeaderData,
    CourseData,
    HourData,
    Companiesdata,
    RetreatData: retreatData,
    MentorData,
    TestimonialData,
    FooterLinkData,
  })
}
