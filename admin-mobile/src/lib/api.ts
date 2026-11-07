import { API_URL } from './config';
import { session } from './session';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Options = { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown; signal?: AbortSignal; auth?: boolean };

const messageFrom = (body: unknown, status: number) => {
  if (body && typeof body === 'object') {
    const error = (body as { error?: unknown }).error;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') return 'Some details are not valid. Check the form and try again.';
  }
  if (status === 401) return 'Your session has ended. Please sign in again.';
  if (status === 403) return 'You do not have access to this.';
  if (status >= 500) return 'The server had a problem. Please try again.';
  return 'Something went wrong. Please try again.';
};

/**
 * Calls the DMRC API with the admin's bearer token. A 401 signs the device
 * out (the session expired or was revoked from the web panel).
 */
export async function api<T>(path: string, { method = 'GET', body, signal, auth = true }: Options = {}): Promise<T> {
  const token = session.get().token;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : null),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : null),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new ApiError('No connection. Check your internet and try again.', 0);
  }

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    if (response.status === 401 && auth && token) await session.clear();
    throw new ApiError(messageFrom(json, response.status), response.status, json);
  }
  return json as T;
}

export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.');

/** Uploads a photo from the device to the site's storage and returns its public URL. */
export async function uploadImage(file: { uri: string; name?: string | null; mimeType?: string | null }, folder = 'uploads') {
  const form = new FormData();
  const name = file.name || `photo-${Date.now()}.jpg`;
  form.append('file', { uri: file.uri, name, type: file.mimeType || 'image/jpeg' } as unknown as Blob);
  form.append('folder', folder);
  const token = session.get().token;
  const response = await fetch(`${API_URL}/api/uploads`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : null) },
    body: form,
  }).catch(() => {
    throw new ApiError('No connection. Check your internet and try again.', 0);
  });
  const json = (await response.json().catch(() => null)) as { data?: { url: string }; error?: string } | null;
  if (!response.ok || !json?.data?.url) throw new ApiError(json?.error ?? 'Upload failed.', response.status, json);
  return json.data.url;
}
