/**
 * Central place for site-wide facts (contact details, navigation, imagery).
 * Update these values instead of hard-coding them inside components.
 */

export const siteConfig = {
  name: 'Divine Mercy Retreat Center',
  shortName: 'DMRC',
  tagline: 'A sanctuary of prayer, healing and renewal',
  description:
    'Divine Mercy Retreat Center (DMRC) Vikindu is a sanctuary of peace and prayer in Tanzania, offering residential retreats, spiritual programmes and community outreach.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  contact: {
    phone: '+255 765 572 679',
    phoneHref: 'tel:+255765572679',
    email: 'dmrc.vikindu@gmail.com',
    secondaryPhone: '0713 840 018',
    address: 'Jesus Town, Vikindu, Tanzania',
    postal: 'P.O. Box 14189, Dar es Salaam',
    officeHours: ['Mon – Fri: 9am – 5pm', 'Sat: 10am – 2pm'],
    mapsHref: 'https://maps.google.com/?q=Divine+Mercy+Retreat+Center+Vikindu',
  },
  // TODO: replace with the centre's real social media profiles.
  social: [
    { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
    { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
    { label: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
  ] as const,
}

export type NavLink = {
  label: string
  href: string
  description?: string
}

export type NavItem = NavLink & {
  children?: NavLink[]
}

export const mainNavigation: NavItem[] = [
  {
    label: 'Retreats',
    href: '/retreats',
    children: [
      { label: 'Upcoming retreats', href: '/retreats', description: 'Browse dates and reserve your place' },
      { label: 'Manage my booking', href: '/retreats/check-booking', description: 'Look up, download or check a ticket' },
      { label: 'Residential retreats', href: '/ministries/residential-retreats', description: 'Five-day silent and preached retreats' },
      { label: 'Parish retreats', href: '/ministries/parish-retreat', description: 'Bring your community to DMRC' },
    ],
  },
  {
    label: 'Worship',
    href: '/mass-intentions',
    children: [
      { label: 'Request a Mass intention', href: '/mass-intentions', description: 'Offer a Mass for a loved one or intention' },
      { label: 'Saturday service', href: '/ministries/saturday-service', description: 'Weekly healing and adoration service' },
      { label: 'Spiritual counselling', href: '/ministries/spiritual-counselling', description: 'Meet a priest for guidance and confession' },
    ],
  },
  {
    label: 'Ministries',
    href: '/ministries',
    children: [
      { label: 'All ministries', href: '/ministries', description: 'Every way we serve the Church' },
      { label: 'Bible convention', href: '/ministries/bible-convention' },
      { label: 'Children’s ministry', href: '/ministries/bible-children' },
      { label: 'Media ministry', href: '/ministries/media-ministries' },
      { label: 'Spiritual partners', href: '/ministries/spiritual-partners' },
    ],
  },
  {
    label: 'Resources',
    href: '/publications',
    children: [
      { label: 'Publications', href: '/publications', description: 'Bibles, books, CDs and calendars' },
      { label: 'News & events', href: '/news', description: 'Stories and announcements from DMRC' },
      { label: 'Gallery', href: '/gallery', description: 'Photos, videos and audio' },
    ],
  },
  { label: 'About', href: '/about' },
]

export const footerNavigation: { title: string; links: NavLink[] }[] = [
  {
    title: 'Visit',
    links: [
      { label: 'Upcoming retreats', href: '/retreats' },
      { label: 'Manage my booking', href: '/retreats/check-booking' },
      { label: 'Ministries', href: '/ministries' },
      { label: 'About DMRC', href: '/about' },
    ],
  },
  {
    title: 'Participate',
    links: [
      { label: 'Mass intentions', href: '/mass-intentions' },
      { label: 'Give online', href: '/donation' },
      { label: 'Publications', href: '/publications' },
      { label: 'News & events', href: '/news' },
      { label: 'Gallery', href: '/gallery' },
    ],
  },
]

/**
 * Stock photography from Unsplash used where the centre has not uploaded its own images.
 * Swap these for DMRC photos (or manage them from the admin homepage editor) when available.
 */
const unsplash = (id: string, width = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`

export const imagery = {
  heroChapel: unsplash('photo-1438032005730-c779502df39b', 2000),
  candles: unsplash('photo-1507692049790-de58290a4334'),
  prayerHands: unsplash('photo-1445445290350-18a3b86e0b5a'),
  bibleReading: unsplash('photo-1504052434569-70ad5836ab65'),
  sunriseHills: unsplash('photo-1470252649378-9c29740c9fa8'),
  churchInterior: unsplash('photo-1548625149-fc4a29cf7092'),
  community: unsplash('photo-1529070538774-1843cb3265df'),
  cross: unsplash('photo-1473177104440-ffee2f376098'),
}
