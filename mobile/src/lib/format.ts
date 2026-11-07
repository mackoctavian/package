export const formatTZS = (value: number) => `TZS ${Math.round(value).toLocaleString('en-US')}`;

export const formatDate = (iso?: string | null, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', options);
};

export const monthDay = (iso?: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return { month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(), day: String(date.getDate()) };
};

export const greeting = (now = new Date()) => {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const retreatContribution = (retreat: { isPaid?: boolean; price?: number }) =>
  retreat.isPaid === false || !retreat.price ? 'Free-will offering' : formatTZS(retreat.price);

export const makeReference = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[0-9+\s-]{7,16}$/;
