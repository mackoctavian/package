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

/** Part of the day, for `home.greeting.*`. */
export const greeting = (now = new Date()) => {
  const hour = now.getHours();
  if (hour < 12) return 'morning' as const;
  if (hour < 17) return 'afternoon' as const;
  return 'evening' as const;
};

export const retreatContribution = (
  retreat: { isPaid?: boolean; price?: number },
  t: (key: 'retreats.freeWill') => string,
  money: (value: number) => string = formatTZS,
) => (retreat.isPaid === false || !retreat.price ? t('retreats.freeWill') : money(retreat.price));

/** "5 min read" from the API, in the current language when it is a plain minute count. */
export const readingTimeLabel = (value: string | undefined, t: (key: 'news.minutes', values: { minutes: string }) => string) => {
  if (!value) return '';
  const minutes = value.match(/^(\d+)\s*min/i)?.[1];
  return minutes ? t('news.minutes', { minutes }) : value;
};

export const makeReference = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[0-9+\s-]{7,16}$/;
