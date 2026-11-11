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
    mapsHref: 'https://maps.google.com/?q=Divine+Mercy+Retreat+Center+Vikindu',
  },
  // TODO: replace with the centre's real social media profiles.
  social: [
    { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
    { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
    { label: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
  ] as const,
}

/**
 * Navigation. Labels and descriptions are translated: `id` points at
 * `nav.items.<id>` in `src/i18n/messages/nav.ts` (and footer groups at
 * `nav.footer.<id>`), so the same structure serves English and Swahili.
 */
export type NavLink = {
  id: string
  href: string
  /** Show the `nav.items.<id>.description` line in dropdowns. */
  described?: boolean
}

export type NavItem = NavLink & {
  children?: NavLink[]
}

export const mainNavigation: NavItem[] = [
  {
    id: 'retreats',
    href: '/retreats',
    children: [
      { id: 'upcomingRetreats', href: '/retreats', described: true },
      { id: 'manageBooking', href: '/retreats/check-booking', described: true },
      { id: 'residentialRetreats', href: '/ministries/residential-retreats', described: true },
      { id: 'parishRetreats', href: '/ministries/parish-retreat', described: true },
    ],
  },
  {
    id: 'worship',
    href: '/mass-intentions',
    children: [
      { id: 'massIntention', href: '/mass-intentions', described: true },
      { id: 'saturdayService', href: '/ministries/saturday-service', described: true },
      { id: 'counselling', href: '/ministries/spiritual-counselling', described: true },
    ],
  },
  {
    id: 'ministries',
    href: '/ministries',
    children: [
      { id: 'allMinistries', href: '/ministries', described: true },
      { id: 'bibleConvention', href: '/ministries/bible-convention' },
      { id: 'childrensMinistry', href: '/ministries/bible-children' },
      { id: 'mediaMinistry', href: '/ministries/media-ministries' },
      { id: 'spiritualPartners', href: '/ministries/spiritual-partners' },
    ],
  },
  {
    id: 'resources',
    href: '/publications',
    children: [
      { id: 'publications', href: '/publications', described: true },
      { id: 'news', href: '/news', described: true },
      { id: 'gallery', href: '/gallery', described: true },
    ],
  },
  { id: 'about', href: '/about' },
]

export const footerNavigation: { id: string; links: NavLink[] }[] = [
  {
    id: 'visit',
    links: [
      { id: 'upcomingRetreats', href: '/retreats' },
      { id: 'manageBooking', href: '/retreats/check-booking' },
      { id: 'ministries', href: '/ministries' },
      { id: 'aboutDmrc', href: '/about' },
    ],
  },
  {
    id: 'participate',
    links: [
      { id: 'massIntentions', href: '/mass-intentions' },
      { id: 'giveOnline', href: '/donation' },
      { id: 'publications', href: '/publications' },
      { id: 'news', href: '/news' },
      { id: 'gallery', href: '/gallery' },
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
