import Constants from 'expo-constants';

/**
 * Base URL of the DMRC website, whose `/api` routes power the admin app.
 * Override per build with EXPO_PUBLIC_API_URL (see .env.example).
 */
const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || fromExtra || 'https://dmrc.vercel.app').replace(/\/$/, '');

/** Turns site-relative media paths (e.g. /images/…) into absolute URLs. */
export const mediaUrl = (value?: string | null) => {
  if (!value) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return `${API_URL}${encodeURI(value)}`;
  return value;
};
