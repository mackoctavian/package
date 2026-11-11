export const formatTZS = (value: number) => `TZS ${Math.round(value || 0).toLocaleString('en-US')}`;

/** Short form for big numbers on stat tiles: 1.2M, 840K. */
export const compactTZS = (value: number) => {
  const abs = Math.abs(value || 0);
  if (abs >= 1_000_000) return `TZS ${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `TZS ${Math.round(value / 1000)}K`;
  return formatTZS(value);
};

export const formatDate = (iso?: string | null, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', options);
};

export const formatTime = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (iso?: string | null) => (iso ? `${formatDate(iso)} · ${formatTime(iso)}` : '');

/**
 * "5 minutes ago", "yesterday", "in 3 days". Written by hand because Hermes
 * (the JavaScript engine in Android and iOS builds) has no Intl.RelativeTimeFormat.
 */
export const relativeTime = (iso?: string | null) => {
  if (!iso) return '';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';
  const seconds = Math.round((time - Date.now()) / 1000);
  const units: [string, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) < size) continue;
    const count = Math.round(Math.abs(seconds) / size);
    if (unit === 'day' && count === 1) return seconds < 0 ? 'yesterday' : 'tomorrow';
    const label = `${count} ${unit}${count === 1 ? '' : 's'}`;
    return seconds < 0 ? `${label} ago` : `in ${label}`;
  }
  return 'just now';
};

export const greeting = (now = new Date()) => {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const firstName = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  const honorifics = /^(fr|sr|br|rev|dr|mr|mrs|ms|bishop|deacon)\.?$/i;
  return honorifics.test(parts[0] ?? '') && parts[1] ? `${parts[0]} ${parts[1]}` : (parts[0] ?? '');
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

export const monthLabel = (yyyyMm: string) => {
  const [year, month] = yyyyMm.split('-').map(Number);
  return new Date(year, (month || 1) - 1, 1).toLocaleDateString('en-GB', { month: 'short' });
};

/** YYYY-MM-DD for a date input. */
export const isoDay = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
