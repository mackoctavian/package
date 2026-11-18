import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from './config';

/**
 * A small read-only client for the Supabase Data API (PostgREST).
 *
 * The app only reads public content, so it uses plain `fetch` with the
 * anon / publishable key instead of the full supabase-js client: nothing to
 * polyfill on Android, and nothing that can keep a session. What the key may
 * read is decided by the row level security policies in
 * `prisma/sql/005_mobile_public_read.sql`.
 */

export class DataApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

const TIMEOUT_MS = 12000;

const headers = (): Record<string, string> => {
  const base: Record<string, string> = { apikey: SUPABASE_ANON_KEY, Accept: 'application/json' };
  // Legacy anon keys are JWTs and also go in Authorization; new publishable keys (sb_publishable_…) only in apikey.
  if (SUPABASE_ANON_KEY.startsWith('eyJ')) base.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  return base;
};

const encode = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

/** `GET /rest/v1/<table>?…`. Always resolves to an array of rows, or throws `DataApiError`. */
export async function selectRows<T = Record<string, unknown>>(table: string, params: Record<string, string> = {}): Promise<T[]> {
  if (!hasSupabase) throw new DataApiError('Supabase is not configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const query = encode({ select: '*', ...params });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: headers(), signal: controller.signal });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = body && typeof body === 'object' && 'message' in body ? String((body as { message: unknown }).message) : `HTTP ${response.status}`;
      throw new DataApiError(`${table}: ${message}`, response.status);
    }
    if (!Array.isArray(body)) throw new DataApiError(`${table}: unexpected response`);
    return body.filter((row): row is T => Boolean(row) && typeof row === 'object');
  } catch (error) {
    if (error instanceof DataApiError) throw error;
    throw new DataApiError(`${table}: ${error instanceof Error ? error.message : 'network error'}`);
  } finally {
    clearTimeout(timer);
  }
}

/** PostgREST `in.(…)` filter value with each id quoted. */
export const inList = (values: string[]) => `in.(${values.map((value) => `"${value.replace(/(["\\])/g, '\\$1')}"`).join(',')})`;
