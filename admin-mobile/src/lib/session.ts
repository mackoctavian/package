import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

import type { AccessLevel, AdminProfile, ModuleId } from './types';

/**
 * The signed-in admin. The bearer token lives in the device keychain
 * (SecureStore); the profile is cached next to it so the app opens offline
 * straight onto the right screens, then refreshes from the server.
 */
type SessionState = {
  hydrated: boolean;
  token: string | null;
  user: AdminProfile | null;
};

const TOKEN_KEY = 'dmrc-admin-token';
const PROFILE_KEY = 'dmrc-admin-profile';

let state: SessionState = { hydrated: false, token: null, user: null };
const listeners = new Set<() => void>();

const emit = (next: Partial<SessionState>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

const storage = {
  get: async (key: string) => {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  set: async (key: string, value: string) => {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(key, value);
    return SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
  },
  remove: async (key: string) => {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export const session = {
  get: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async hydrate() {
    try {
      const [token, profile] = await Promise.all([storage.get(TOKEN_KEY), storage.get(PROFILE_KEY)]);
      emit({ hydrated: true, token, user: token && profile ? (JSON.parse(profile) as AdminProfile) : null });
    } catch {
      emit({ hydrated: true, token: null, user: null });
    }
  },
  async signIn(token: string, user: AdminProfile) {
    emit({ token, user });
    await Promise.all([storage.set(TOKEN_KEY, token), storage.set(PROFILE_KEY, JSON.stringify(user))]).catch(() => undefined);
  },
  async setUser(user: AdminProfile) {
    emit({ user });
    await storage.set(PROFILE_KEY, JSON.stringify(user)).catch(() => undefined);
  },
  async clear() {
    emit({ token: null, user: null });
    await Promise.all([storage.remove(TOKEN_KEY), storage.remove(PROFILE_KEY)]).catch(() => undefined);
  },
};

export function useSession<T>(select: (s: SessionState) => T): T {
  return useSyncExternalStore(session.subscribe, () => select(session.get()));
}

/** The user's level in an area, mirroring getModuleAccess on the web. */
export const accessLevel = (user: AdminProfile | null, moduleId: ModuleId): AccessLevel | null => {
  if (!user) return null;
  if (user.role === 'SUPERADMIN') return 'edit';
  return user.access.find((entry) => entry.id === moduleId)?.level ?? null;
};

export const can = (user: AdminProfile | null, moduleId: ModuleId, level: AccessLevel = 'view') => {
  const held = accessLevel(user, moduleId);
  if (!held) return false;
  return level === 'view' || held === 'edit';
};

/** Hook form: `const canEdit = useCan('retreats', 'edit')`. */
export const useCan = (moduleId: ModuleId, level: AccessLevel = 'view') => useSession((s) => can(s.user, moduleId, level));

/** Ticket scanning is allowed with check-in desk access or full retreats access. */
export const canScan = (user: AdminProfile | null) => can(user, 'check-in', 'edit') || can(user, 'retreats', 'edit');
