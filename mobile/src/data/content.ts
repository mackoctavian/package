/** Static content bundled with the app (mirrors the website's giving and onboarding copy). */

export const UNSPLASH = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export const imagery = {
  heroChapel: UNSPLASH('photo-1438032005730-c779502df39b', 1400),
  candles: UNSPLASH('photo-1507692049790-de58290a4334'),
  prayerHands: UNSPLASH('photo-1445445290350-18a3b86e0b5a'),
  bibleReading: UNSPLASH('photo-1504052434569-70ad5836ab65'),
  sunriseHills: UNSPLASH('photo-1470252649378-9c29740c9fa8'),
  churchInterior: UNSPLASH('photo-1548625149-fc4a29cf7092'),
  community: UNSPLASH('photo-1529070538774-1843cb3265df'),
  cross: UNSPLASH('photo-1473177104440-ffee2f376098'),
};

export const onboardingSlides = [
  {
    key: 'welcome',
    image: UNSPLASH('photo-1438032005730-c779502df39b', 1400),
    eyebrow: 'Divine Mercy Retreat Center',
    title: 'A sanctuary of prayer, healing and renewal',
    body: 'Carry DMRC Vikindu with you: retreats, Mass, giving and the bookshop, all in one place.',
  },
  {
    key: 'retreats',
    image: UNSPLASH('photo-1470252649378-9c29740c9fa8', 1400),
    eyebrow: 'Retreats',
    title: 'Reserve your place in a few taps',
    body: 'Browse upcoming retreats, book for yourself and your family, and keep your ticket on your phone.',
  },
  {
    key: 'mass',
    image: UNSPLASH('photo-1507692049790-de58290a4334', 1400),
    eyebrow: 'Mass intentions',
    title: 'Offer a Mass for those you love',
    body: 'Send an intention for thanksgiving, healing or the faithful departed, wherever you are.',
  },
  {
    key: 'give',
    image: UNSPLASH('photo-1529070538774-1843cb3265df', 1400),
    eyebrow: 'Give & grow',
    title: 'Support the mission and grow in faith',
    body: 'Give to the work of mercy, order Bibles and books, and follow news from the centre.',
  },
] as const;

export const givingFunds = [
  { id: 'general', label: 'Where most needed', icon: 'heart-circle-outline', text: 'Lets the centre direct your gift to the greatest need.' },
  { id: 'scholarships', label: 'Retreat scholarships', icon: 'school-outline', text: 'Helps youth and families who cannot afford a retreat.' },
  { id: 'outreach', label: 'Mercy outreach', icon: 'hand-left-outline', text: 'Supports the poor, the sick and parish missions.' },
  { id: 'chapel', label: 'Chapel & house', icon: 'business-outline', text: 'Cares for the chapel, rooms and grounds of DMRC.' },
] as const;

export const givingPresets = [10000, 25000, 50000, 100000, 250000];

export const SUGGESTED_OFFERING_PER_MASS = 10000;

export const intentionTypes = [
  { id: 'thanksgiving', label: 'Thanksgiving', icon: 'sparkles-outline', description: 'For blessings received', placeholder: 'e.g. My family' },
  { id: 'healing', label: 'Healing', icon: 'heart-outline', description: 'Body, mind or spirit', placeholder: 'e.g. Maria Josephat' },
  { id: 'deceased', label: 'Repose of a soul', icon: 'flower-outline', description: 'For the faithful departed', placeholder: 'e.g. The late John Mushi' },
  { id: 'family', label: 'Family', icon: 'people-outline', description: 'Blessing on your family', placeholder: 'e.g. The Kimaro family' },
  { id: 'special', label: 'Special intention', icon: 'flame-outline', description: 'Any other intention', placeholder: 'e.g. A special intention' },
] as const;

export const retreatTerms = [
  { title: 'Registration & confirmation', body: 'All bookings must be completed through our official registration system. A confirmation will be sent to your registered email and phone number.' },
  { title: 'Payment', body: 'Where a contribution applies, payment must be completed within the timeframe communicated after registration. Unpaid bookings may be cancelled.' },
  { title: 'Cancellation', body: 'Cancellations made 7 days before the retreat start date are eligible for a full refund. Later cancellations may receive a partial refund or none, depending on circumstances.' },
  { title: 'Conduct', body: 'Participants are expected to keep silence where asked, maintain proper decorum and follow the retreat schedule. Disruptive behaviour may lead to removal without refund.' },
  { title: 'Accommodation', body: 'Accommodation is shared unless otherwise specified. Participants are responsible for their personal belongings; the centre is not liable for loss or damage.' },
  { title: 'Health', body: 'Please tell the organisers about any medical conditions or dietary needs in advance and bring your personal medication. Basic first aid is available.' },
  { title: 'Photography', body: 'Photos and videos may be taken for the centre’s communications. If you prefer not to be photographed, please tell the organisers on arrival.' },
  { title: 'Liability', body: 'The retreat centre and organisers are not liable for injury, illness or accident during the retreat. Participants attend at their own risk.' },
];

export const scriptures = [
  { text: 'Jesus, I trust in You.', ref: 'Divine Mercy Image' },
  { text: 'Come to me, all you who are weary and burdened, and I will give you rest.', ref: 'Matthew 11:28' },
  { text: 'The steadfast love of the Lord never ceases; his mercies never come to an end.', ref: 'Lamentations 3:22' },
  { text: 'Be still, and know that I am God.', ref: 'Psalm 46:10' },
  { text: 'Blessed are the merciful, for they shall obtain mercy.', ref: 'Matthew 5:7' },
  { text: 'I will restore you to health and heal your wounds.', ref: 'Jeremiah 30:17' },
  { text: 'Let us then approach the throne of grace with confidence, so that we may receive mercy.', ref: 'Hebrews 4:16' },
];

export const scriptureOfTheDay = (now = new Date()) => {
  const start = new Date(now.getFullYear(), 0, 0).getTime();
  const day = Math.floor((now.getTime() - start) / 86_400_000);
  return scriptures[day % scriptures.length];
};

export const mobileNetworks = ['M-Pesa (Vodacom)', 'Mixx by Yas (Tigo Pesa)', 'Airtel Money', 'HaloPesa'] as const;

/** About copy, mirrored from the website's bundled About page (src/app/data/about.ts). */
export const about = {
  history:
    'Divine Mercy Retreat Center (DMRC) Vikindu stands as a beacon of spiritual renewal in East Africa. Established in 2010 by the Vincentian Congregation, the centre has grown into one of the most vibrant retreat houses in Tanzania, welcoming parishes, families, young people and religious for preached retreats, healing services and the sacraments.',
  mission:
    'To proclaim the merciful love of Jesus through retreats, the sacraments and works of mercy, so that every person who comes to Vikindu may encounter Christ, be healed and be sent out as a witness of mercy.',
  pillars: [
    { title: 'Encounter', icon: 'eye-outline', text: 'Preached retreats, adoration and the Word of God open hearts to meet Jesus personally.' },
    { title: 'Healing', icon: 'medkit-outline', text: 'Confession, counselling and prayer ministry bring the mercy of Christ to wounded hearts.' },
    { title: 'Mission', icon: 'send-outline', text: 'Renewed people return to their families and parishes as witnesses of mercy.' },
  ],
  milestones: [
    { year: '2010', event: 'DMRC Vikindu inaugurated by the Vincentian Congregation' },
    { year: '2016', event: 'Retreat accommodation expanded' },
    { year: 'Today', event: 'Weekly services, residential and parish retreats all year round' },
  ],
} as const;
