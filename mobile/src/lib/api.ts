import { useQuery } from '@tanstack/react-query';

import snapshot from '@/data/snapshot.json';
import { getLocale, getT, type MobileLocale, useLocale } from '@/i18n';
import { API_URL, hasSupabase } from './config';
import { loadCatalogue, loadGallery, loadHome, loadMinistries, loadNews, loadRetreats } from './content-source';
import type { Article, Booking, Catalogue, Gallery, Home, Ministry, Retreat } from './types';

/**
 * Data access.
 *
 * Reads (retreats, news, publications, gallery, ministries, home) come
 * straight from Supabase's Data API with the public anon key; see
 * `./content-source`. If Supabase isn't configured in this build, the app
 * reads the website's `/api/mobile/*` instead. If neither answers, it falls
 * back to a bundled snapshot so screens never render empty; the `offline`
 * flag lets screens say so. Form submissions always go to the website API,
 * which validates them and sends the confirmation emails.
 */

type Snapshot = {
  home: Home;
  retreats: Retreat[];
  publications: Catalogue;
  news: Article[];
  gallery: Gallery;
  ministries: Ministry[];
};

const bundled = snapshot as unknown as Snapshot;

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

const TIMEOUT_MS = 12000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      // The site answers in the app's language (content, and form errors where translated).
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'x-dmrc-locale': getLocale(), ...(init?.headers ?? {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = typeof body?.error === 'string' ? body.error : getT()('common.errors.generic');
      throw new ApiError(error, response.status);
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(getT()('common.errors.network'));
  } finally {
    clearTimeout(timer);
  }
}

export type Loaded<T> = { data: T; offline: boolean };

/** Reads one dataset from Supabase; `null` means "nothing published yet, use the bundled copy". */
const fromSupabase: { [K in keyof Snapshot]: (locale: MobileLocale) => Promise<Snapshot[K] | null> } = {
  home: (locale) => loadHome(locale, bundled.home, bundled.publications),
  retreats: (locale) => loadRetreats(locale),
  publications: (locale) => loadCatalogue(locale, bundled.publications),
  news: (locale) => loadNews(locale),
  gallery: (locale) => loadGallery(locale),
  ministries: (locale) => loadMinistries(locale, bundled.ministries),
};

/** A response is only used if it has the shape the screens expect; anything else counts as offline. */
const isShape = <K extends keyof Snapshot>(key: K, value: unknown): value is Snapshot[K] => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  switch (key) {
    case 'retreats':
    case 'news':
    case 'ministries':
      return Array.isArray(value);
    case 'publications':
      return Array.isArray(record.items);
    case 'gallery':
      return ['photos', 'videos', 'audio', 'cds'].every((bucket) => Array.isArray(record[bucket]));
    case 'home':
      return (
        Boolean(record.site && typeof record.site === 'object') &&
        ['heroSlides', 'retreats', 'news', 'publications', 'gallery', 'testimonials'].every((field) => Array.isArray(record[field]))
      );
    default:
      return false;
  }
};

async function readWithFallback<K extends keyof Snapshot>(key: K, locale: MobileLocale): Promise<Loaded<Snapshot[K]>> {
  if (hasSupabase) {
    try {
      const data = await fromSupabase[key](locale);
      // `null`: nothing readable yet (e.g. the read policies haven't been added); try the website next.
      if (data !== null && isShape(key, data)) return { data, offline: false };
    } catch (error) {
      if (__DEV__) console.warn(`[data] Supabase read of ${key} failed`, error);
    }
  }
  try {
    const body = await request<{ data?: unknown }>(`/api/mobile/${key}?locale=${locale}`);
    if (isShape(key, body?.data)) return { data: body.data, offline: false };
  } catch {
    // fall through to the bundled copy
  }
  return { data: bundled[key], offline: true };
}

/** Reads in the app's language; switching language refetches while the previous text stays on screen. */
const useRead = <K extends keyof Snapshot>(key: K) => {
  const locale = useLocale();
  return useQuery({
    queryKey: ['mobile', key, locale],
    queryFn: () => readWithFallback(key, locale),
    placeholderData: (previous: Loaded<Snapshot[K]> | undefined) => previous ?? { data: bundled[key], offline: true },
    staleTime: 5 * 60_000,
  });
};

export const useHome = () => useRead('home');
export const useRetreats = () => useRead('retreats');
export const useCatalogue = () => useRead('publications');
export const useNews = () => useRead('news');
export const useGallery = () => useRead('gallery');
export const useMinistries = () => useRead('ministries');

/* ---------------------------------------------------------------- writes */

export type BookingForm = {
  fullName: string;
  gender: string;
  dob: string;
  age: string;
  lifeStatus: string;
  currentStatus: string;
  occupation: string;
  nonCatholic: boolean;
  phone: string;
  whatsappSame: boolean;
  whatsapp: string;
  altPhone: string;
  email: string;
  houseName: string;
  place: string;
  district: string;
  state: string;
  country: string;
  diocese: string;
  parish: string;
  familyMembers: { name: string; relationship: string; age: string }[];
  acceptInstructions: boolean;
  acceptTerms: boolean;
};

export const createBooking = (retreat: Retreat, form: BookingForm) =>
  request<{ data: Booking; ticketCode: string }>('/api/retreats/bookings', {
    method: 'POST',
    body: JSON.stringify({
      retreatId: retreat.id,
      retreatTitle: retreat.title,
      form: {
        ...form,
        whatsapp: form.whatsappSame ? form.phone : form.whatsapp,
        familyMembers: form.familyMembers.filter((member) => member.name.trim()),
        source: 'mobile-app',
      },
    }),
  });

export const lookupBooking = (bookingId: string) =>
  request<{ data: Booking }>('/api/retreats/bookings/lookup', {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
  });

export const cancelBooking = (bookingId: string) =>
  request<{ data: Booking }>(`/api/retreats/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  });

export const rescheduleBooking = (bookingId: string, retreatId: string) =>
  request<{ data: Booking }>(`/api/retreats/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ retreatId, status: 'rescheduled' }),
  });

export type DonationInput = {
  fullName: string;
  email: string;
  phone: string;
  amount: number;
  paymentMethod: 'mobile' | 'card' | 'bank';
  prayerIntention?: string;
  fund: string;
  reference: string;
};

export const recordDonation = ({ fund, reference, ...input }: DonationInput) =>
  request<{ data: { id: string } }>('/api/donations', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      currency: 'TZS',
      metadata: { source: 'mobile-app', fund, reference, demoCheckout: true },
    }),
  });

export type MassIntentionInput = {
  fullName: string;
  email: string;
  phone: string;
  intentionType: string;
  intentionFor: string;
  intentionDetails: string;
  preferredDate?: string;
  numberOfMasses: number;
  donationAmount: string;
};

export const submitMassIntention = (input: MassIntentionInput) =>
  request<{ data: { id: string } }>('/api/mass-intentions', {
    method: 'POST',
    body: JSON.stringify({ ...input, acceptTerms: true, metadata: { source: 'mobile-app' } }),
  });
