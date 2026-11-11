import Constants from 'expo-constants';
import { useSyncExternalStore } from 'react';

import { storage } from './storage';

/**
 * Base URL of the DMRC website, whose `/api` routes power the admin app.
 * The build default comes from EXPO_PUBLIC_API_URL or app.json `extra.apiUrl`.
 * Staff can change it on the sign-in screen; that choice is kept on the device.
 */
const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const DEFAULT_API_URL = (process.env.EXPO_PUBLIC_API_URL || fromExtra || 'https://dmrc-ten.vercel.app').replace(/\/$/, '');

const SERVER_KEY = 'dmrc-admin-server';
let current = DEFAULT_API_URL;
const listeners = new Set<() => void>();

/** The website the app talks to right now. */
export const apiUrl = () => current;

/** "dmrc.or.tz/login" or "https://www.dmrc.or.tz/admin/" → "https://www.dmrc.or.tz". Null when it isn't a web address. */
export const normalizeServer = (input: string) => {
  const value = input.trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const match = /^(https?:\/\/[a-z0-9.-]+(?::\d+)?)(?:[/?#].*)?$/i.exec(withScheme);
  if (!match || (!match[1].includes('.') && !/localhost/i.test(match[1]))) return null;
  return match[1].toLowerCase();
};

export const server = {
  async load() {
    const saved = await storage.get(SERVER_KEY).catch(() => null);
    if (saved) current = saved;
    listeners.forEach((listener) => listener());
  },
  /** Saves a website address, or resets to the build default with null. */
  async set(url: string | null) {
    current = url ?? DEFAULT_API_URL;
    listeners.forEach((listener) => listener());
    await (url && url !== DEFAULT_API_URL ? storage.set(SERVER_KEY, url) : storage.remove(SERVER_KEY)).catch(() => undefined);
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useApiUrl = () => useSyncExternalStore(server.subscribe, apiUrl);

/** "https://www.dmrc.or.tz" → "www.dmrc.or.tz" */
export const hostOf = (url: string) => url.replace(/^https?:\/\//, '');

/** Turns site-relative media paths (e.g. /images/…) into absolute URLs. */
export const mediaUrl = (value?: string | null) => {
  if (!value) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return `${current}${encodeURI(value)}`;
  return value;
};
