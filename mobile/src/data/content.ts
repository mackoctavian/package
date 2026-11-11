/**
 * Static content bundled with the app: ids, icons and images. All wording
 * lives in `src/i18n/messages.ts` (English and Swahili) under `content.*`
 * and `onboarding.*`, keyed by the ids below.
 */

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
  { key: 'welcome', image: UNSPLASH('photo-1438032005730-c779502df39b', 1400) },
  { key: 'retreats', image: UNSPLASH('photo-1470252649378-9c29740c9fa8', 1400) },
  { key: 'mass', image: UNSPLASH('photo-1507692049790-de58290a4334', 1400) },
  { key: 'give', image: UNSPLASH('photo-1529070538774-1843cb3265df', 1400) },
] as const;

export const givingFunds = [
  { id: 'general', icon: 'heart-circle-outline' },
  { id: 'scholarships', icon: 'school-outline' },
  { id: 'outreach', icon: 'hand-left-outline' },
  { id: 'chapel', icon: 'business-outline' },
] as const;

export const givingPresets = [10000, 25000, 50000, 100000, 250000];

export const SUGGESTED_OFFERING_PER_MASS = 10000;

export const intentionTypes = [
  { id: 'thanksgiving', icon: 'sparkles-outline' },
  { id: 'healing', icon: 'heart-outline' },
  { id: 'deceased', icon: 'flower-outline' },
  { id: 'family', icon: 'people-outline' },
  { id: 'special', icon: 'flame-outline' },
] as const;

/** Ids of the retreat terms, in order (`content.terms.<id>.title|body`). */
export const retreatTerms = ['registration', 'payment', 'cancellation', 'conduct', 'accommodation', 'health', 'photography', 'liability'] as const;

/** Ids of the daily scriptures (`content.scriptures.<id>.text|ref`). */
export const scriptures = ['trust', 'weary', 'steadfast', 'still', 'merciful', 'restore', 'grace'] as const;

export const scriptureOfTheDay = (now = new Date()) => {
  const start = new Date(now.getFullYear(), 0, 0).getTime();
  const day = Math.floor((now.getTime() - start) / 86_400_000);
  return scriptures[day % scriptures.length];
};

export const mobileNetworks = ['M-Pesa (Vodacom)', 'Mixx by Yas (Tigo Pesa)', 'Airtel Money', 'HaloPesa'] as const;

/** About page structure (`content.about.*` holds the wording). */
export const about = {
  pillars: [
    { id: 'encounter', icon: 'eye-outline' },
    { id: 'healing', icon: 'medkit-outline' },
    { id: 'mission', icon: 'send-outline' },
  ],
  milestones: ['founded', 'expanded', 'today'],
} as const;
