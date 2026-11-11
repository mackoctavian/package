import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * Small persisted app store (onboarding, saved tickets, cart, receipts, profile).
 * Everything here stays on the device; nothing sensitive such as card details is kept.
 */

export type SavedTicket = {
  code: string;
  bookingId: string;
  retreatSlug?: string;
  retreatTitle: string;
  dateRange?: string;
  fullName: string;
  savedAt: string;
};

export type CartItem = { id: string; slug: string; title: string; coverImage: string; price: number; quantity: number };

export type Receipt = {
  reference: string;
  kind: 'donation' | 'mass-intention' | 'order';
  title: string;
  amount: number;
  createdAt: string;
  detail?: string;
};

export type Profile = { fullName: string; email: string; phone: string };

export type AppLanguage = 'en' | 'sw';

export type AppState = {
  hydrated: boolean;
  onboarded: boolean;
  tickets: SavedTicket[];
  cart: CartItem[];
  receipts: Receipt[];
  profile: Profile;
  /** The language the user picked; `null` follows the phone's language. */
  language: AppLanguage | null;
  /** Interface text the admin changed on the website, per language (cached for offline use). */
  uiOverrides: Partial<Record<AppLanguage, Record<string, string>>>;
};

const KEY = 'dmrc.app.v1';

let state: AppState = {
  hydrated: false,
  onboarded: false,
  tickets: [],
  cart: [],
  receipts: [],
  profile: { fullName: '', email: '', phone: '' },
  language: null,
  uiOverrides: {},
};

const listeners = new Set<() => void>();

const persist = () => {
  const { hydrated: _hydrated, ...rest } = state;
  AsyncStorage.setItem(KEY, JSON.stringify(rest)).catch(() => undefined);
};

const setState = (update: Partial<AppState> | ((current: AppState) => Partial<AppState>)) => {
  const patch = typeof update === 'function' ? update(state) : update;
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
  persist();
};

export const hydrateStore = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<AppState>) : {};
    state = { ...state, ...saved, hydrated: true };
  } catch {
    state = { ...state, hydrated: true };
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useAppStore<T>(selector: (current: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export const getAppState = () => state;

export const actions = {
  completeOnboarding: () => setState({ onboarded: true }),
  setLanguage: (language: AppLanguage | null) => setState({ language }),
  setUiOverrides: (language: AppLanguage, messages: Record<string, string>) =>
    setState((current) => ({ uiOverrides: { ...current.uiOverrides, [language]: messages } })),
  resetOnboarding: () => setState({ onboarded: false }),

  saveProfile: (profile: Partial<Profile>) =>
    setState((current) => ({
      profile: {
        fullName: profile.fullName?.trim() || current.profile.fullName,
        email: profile.email?.trim() || current.profile.email,
        phone: profile.phone?.trim() || current.profile.phone,
      },
    })),

  saveTicket: (ticket: SavedTicket) =>
    setState((current) => ({ tickets: [ticket, ...current.tickets.filter((item) => item.code !== ticket.code)] })),
  removeTicket: (code: string) => setState((current) => ({ tickets: current.tickets.filter((item) => item.code !== code) })),
  updateTicket: (code: string, patch: Partial<SavedTicket>) =>
    setState((current) => ({ tickets: current.tickets.map((item) => (item.code === code ? { ...item, ...patch } : item)) })),

  addToCart: (item: Omit<CartItem, 'quantity'>, quantity = 1, max = 8) =>
    setState((current) => {
      const existing = current.cart.find((entry) => entry.id === item.id);
      if (existing) {
        return {
          cart: current.cart.map((entry) =>
            entry.id === item.id ? { ...entry, quantity: Math.min(max, entry.quantity + quantity) } : entry,
          ),
        };
      }
      return { cart: [...current.cart, { ...item, quantity: Math.min(max, quantity) }] };
    }),
  setQuantity: (id: string, quantity: number) =>
    setState((current) => ({
      cart:
        quantity <= 0
          ? current.cart.filter((entry) => entry.id !== id)
          : current.cart.map((entry) => (entry.id === id ? { ...entry, quantity } : entry)),
    })),
  clearCart: () => setState({ cart: [] }),

  addReceipt: (receipt: Receipt) => setState((current) => ({ receipts: [receipt, ...current.receipts].slice(0, 50) })),

  clearAll: () =>
    setState({ tickets: [], cart: [], receipts: [], profile: { fullName: '', email: '', phone: '' } }),
};

export const cartCount = (cart: CartItem[]) => cart.reduce((sum, item) => sum + item.quantity, 0);
export const cartTotal = (cart: CartItem[]) => cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
