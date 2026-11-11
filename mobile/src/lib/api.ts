import { useQuery } from '@tanstack/react-query';

import snapshot from '@/data/snapshot.json';
import { getLocale, getT, type MobileLocale, useLocale } from '@/i18n';
import { API_URL } from './config';
import type { Article, Booking, Catalogue, Gallery, Home, Ministry, Retreat } from './types';

/**
 * Data access for the DMRC website API.
 *
 * Read endpoints live under `/api/mobile/*`. If the network is unavailable the
 * app falls back to a bundled snapshot so screens never render empty; the
 * `offline` flag lets screens say so. Form submissions always go to the live API.
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

async function readWithFallback<K extends keyof Snapshot>(key: K, locale: MobileLocale): Promise<Loaded<Snapshot[K]>> {
  try {
    const body = await request<{ data: Snapshot[K] }>(`/api/mobile/${key}?locale=${locale}`);
    return { data: body.data, offline: false };
  } catch {
    return { data: bundled[key], offline: true };
  }
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
