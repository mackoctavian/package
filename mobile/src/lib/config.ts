import Constants from 'expo-constants';

type Extra = { apiUrl?: string; supabaseUrl?: string; supabaseAnonKey?: string } | undefined;
const extra = Constants.expoConfig?.extra as Extra;

/**
 * Base URL of the DMRC website. The app sends forms (bookings, donations,
 * Mass intentions) here, and uses it for site-relative images.
 * Override per build with EXPO_PUBLIC_API_URL (see mobile/.env.example).
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || extra?.apiUrl || 'https://dmrc-ten.vercel.app').replace(/\/$/, '');

/**
 * Supabase project the app reads public content from directly (retreats,
 * news, publications, gallery, ministries, homepage). Only the public
 * anon / publishable key belongs here: row level security decides what it can
 * read. Never put the service role key in the app.
 */
export const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || extra?.supabaseUrl || '').trim().replace(/\/$/, '');
export const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra?.supabaseAnonKey || '').trim();
export const hasSupabase = /^https:\/\//.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20;

/** Turns site-relative media paths (e.g. /images/…) into absolute URLs. */
export const mediaUrl = (value?: string | null) => {
  if (!value) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) {
    let path = value;
    try {
      path = encodeURI(decodeURI(value)); // e.g. "/images/My photo.jpg"; already-encoded paths stay as they are
    } catch {
      // Malformed escape sequence: use the path as stored.
    }
    return `${API_URL}${path}`;
  }
  return value;
};
