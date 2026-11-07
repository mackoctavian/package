import { type QueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { api } from './api';
import { session } from './session';
import type {
  AdminProfile,
  BookingsResponse,
  ContentItem,
  ContentType,
  Overview,
  RecordKind,
  RecordsResponse,
} from './types';

export const keys = {
  overview: ['overview'] as const,
  bookings: (filters: Record<string, string>) => ['bookings', filters] as const,
  booking: (id: string) => ['booking', id] as const,
  records: (kind: RecordKind, filters: Record<string, string>) => ['records', kind, filters] as const,
  record: (kind: RecordKind, id: string) => ['record', kind, id] as const,
  checkIn: (retreatId?: string) => ['check-in', retreatId ?? 'none'] as const,
  retreats: ['retreats'] as const,
  retreat: (id: string) => ['retreat', id] as const,
  content: (type: ContentType) => ['content', type] as const,
  team: ['team'] as const,
  activity: ['activity'] as const,
};

export async function refreshProfile() {
  const response = await api<{ data: AdminProfile }>('/api/mobile/admin/session');
  await session.setUser(response.data);
  return response.data;
}

export const useOverview = () =>
  useQuery({
    queryKey: keys.overview,
    queryFn: ({ signal }) => api<{ data: Overview }>('/api/mobile/admin/overview', { signal }).then((r) => r.data),
  });

const query = (filters: Record<string, string>, page: number) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });
  params.set('page', String(page));
  return params.toString();
};

export const useBookings = (filters: Record<string, string>) =>
  useInfiniteQuery({
    queryKey: keys.bookings(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => api<BookingsResponse>(`/api/admin/bookings?${query(filters, pageParam)}`, { signal }),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });

export const useRecords = <T,>(kind: RecordKind, filters: Record<string, string>, enabled = true) =>
  useInfiniteQuery({
    queryKey: keys.records(kind, filters),
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => api<RecordsResponse<T>>(`/api/admin/records/${kind}?${query(filters, pageParam)}`, { signal }),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });

export const useContent = (type: ContentType) =>
  useQuery({
    queryKey: keys.content(type),
    queryFn: ({ signal }) => api<{ data: ContentItem[] }>(`/api/content/${type}`, { signal }).then((r) => r.data),
  });

/** Everything that shows booking numbers, refreshed after a booking changes. */
export const invalidateBookings = (client: QueryClient) =>
  Promise.all([
    client.invalidateQueries({ queryKey: ['bookings'] }),
    client.invalidateQueries({ queryKey: ['booking'] }),
    client.invalidateQueries({ queryKey: ['check-in'] }),
    client.invalidateQueries({ queryKey: keys.overview }),
  ]);

export const invalidateRecords = (client: QueryClient, kind: RecordKind) =>
  Promise.all([
    client.invalidateQueries({ queryKey: ['records', kind] }),
    client.invalidateQueries({ queryKey: ['record', kind] }),
    client.invalidateQueries({ queryKey: keys.overview }),
  ]);
