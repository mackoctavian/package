import type { MobileLocale } from '@/i18n/messages';
import { mobileMessages } from '@/i18n/messages';
import { imagery } from '@/data/content';
import { inList, selectRows } from './supabase';
import type { Article, ArticleSection, Catalogue, Gallery, GalleryMedia, Home, Ministry, Publication, Retreat, RetreatStatus } from './types';

/**
 * Public content read straight from Supabase, shaped exactly like the
 * website's `/api/mobile/*` responses so the screens don't change.
 *
 * Every value from the database goes through a type check here, so a missing
 * column or an unexpected value shows a blank instead of closing the app.
 * Each loader returns `null` when the table has nothing published yet; the
 * caller then uses the bundled snapshot, as the website does with its own
 * built-in content.
 */

type Row = Record<string, unknown>;

/* ------------------------------------------------------------ primitives */

const str = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value : undefined);
const text = (value: unknown, fallback = '') => (typeof value === 'string' ? value : value == null ? fallback : String(value));
const num = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
};
const obj = (value: unknown): Row => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Row;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Row;
    } catch {
      // not JSON
    }
  }
  return {};
};
const list = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/** Postgres `timestamp` (no zone) comes back as "2025-11-01T10:00:00.123"; Prisma stores those as UTC. */
const iso = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value) return undefined;
  const withZone = /[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const camelize = (row: Row): Row => Object.fromEntries(Object.entries(row).map(([key, value]) => [camel(key), value]));

/* ---------------------------------------------------------- translations */

type Entity = 'retreat' | 'content' | 'ministry' | 'hero_slide' | 'testimonial';

/** Translatable fields per entity (mirrors src/lib/i18n/entities.ts on the website). */
const FIELDS: Record<Entity, Record<string, 'text' | 'list'>> = {
  retreat: { title: 'text', subtitle: 'text', description: 'text', location: 'text', timeRange: 'text' },
  content: {
    title: 'text',
    summary: 'text',
    body: 'text',
    category: 'text',
    'meta.featuredQuote': 'text',
    'meta.featuredScripture': 'text',
    'meta.badge': 'text',
  },
  ministry: { title: 'text', shortDescription: 'text', overview: 'text', highlightScripture: 'text', focusAreas: 'list', gatherings: 'list' },
  hero_slide: { title: 'text', subtitle: 'text', linkText: 'text' },
  testimonial: { quote: 'text', role: 'text' },
};

const mergeList = (english: unknown, translated: unknown[]) => {
  if (!Array.isArray(english)) return english;
  return english.map((item, index) => {
    const overlay = translated[index];
    if (!overlay || typeof overlay !== 'object') return item;
    const fields = overlay as Row;
    if (typeof item === 'string') return str(fields.title) ?? item;
    if (!item || typeof item !== 'object') return item;
    const merged: Row = { ...(item as Row) };
    for (const [key, value] of Object.entries(fields)) if (str(value)) merged[key] = value;
    return merged;
  });
};

/** Lays Swahili (or other) translations over English rows (with camelCase keys, as the website stores field names). English stays wherever a field has no translation. */
async function localize(entity: Entity, rows: Row[], locale: MobileLocale): Promise<Row[]> {
  if (locale === 'en' || !rows.length) return rows;
  const ids = [...new Set(rows.map((row) => text(row.id)).filter(Boolean))];
  let translations: Row[] = [];
  try {
    translations = await selectRows('content_translations', {
      select: 'entity_id,field,value',
      entity: `eq.${entity}`,
      locale: `eq.${locale}`,
      entity_id: inList(ids),
    });
  } catch {
    return rows; // Translations unavailable: show English rather than nothing.
  }
  const byId = new Map<string, Row>();
  for (const t of translations) {
    const value = str(t.value);
    const id = text(t.entity_id);
    const field = text(t.field);
    if (!value || !id || !field) continue;
    byId.set(id, { ...(byId.get(id) ?? {}), [field]: value });
  }
  const known = FIELDS[entity];
  return rows.map((row) => {
    const fields = byId.get(text(row.id));
    if (!fields) return row;
    const next: Row = { ...row };
    for (const [field, value] of Object.entries(fields)) {
      const kind = known[field];
      if (!kind) continue;
      if (field.startsWith('meta.')) {
        next.metadata = { ...obj(next.metadata), [field.slice(5)]: value };
      } else if (kind === 'list') {
        const translated = list(value);
        if (translated.length) next[field] = mergeList(list(next[field]), translated);
      } else {
        next[field] = value;
      }
    }
    return next;
  });
}

/* ----------------------------------------------------------------- dates */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthIndex = (token: string) => MONTHS.indexOf(token.slice(0, 3).toLowerCase());

/**
 * Parses the date formats admins type ("Dec 10, 2025", "10 Dec 2025",
 * "2025-12-10", "December 10"). Done by hand because Android's JavaScript
 * engine does not parse free-text dates the way Node does.
 */
const parseLooseDate = (value: string, fallbackYear: number | null): Date | null => {
  const input = value.trim().replace(/,/g, ' ').replace(/\s+/g, ' ');
  if (!input) return null;
  const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  const yearMatch = input.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : fallbackYear;
  const withoutYear = input.replace(/\b(19|20)\d{2}\b/, '').trim();
  let match = withoutYear.match(/^([A-Za-z]+)\.? (\d{1,2})(?:st|nd|rd|th)?$/); // Dec 10
  let month = -1;
  let day = NaN;
  if (match) {
    month = monthIndex(match[1]);
    day = Number(match[2]);
  } else {
    match = withoutYear.match(/^(\d{1,2})(?:st|nd|rd|th)? ([A-Za-z]+)\.?$/); // 10 Dec
    if (match) {
      day = Number(match[1]);
      month = monthIndex(match[2]);
    }
  }
  if (month < 0 || !Number.isFinite(day) || day < 1 || day > 31 || year === null) return null;
  return new Date(year, month, day);
};

const SEPARATORS = ['–', '—', ' to ', ' - '];

export const parseRetreatDates = (dateRange?: string | null): { start: Date | null; end: Date | null } => {
  const value = dateRange?.trim() ?? '';
  if (!value) return { start: null, end: null };
  let startToken = value;
  let endToken = '';
  for (const separator of SEPARATORS) {
    if (value.includes(separator)) {
      const [a, b] = value.split(separator);
      startToken = a?.trim() ?? '';
      endToken = b?.trim() ?? '';
      break;
    }
  }
  const yearMatch = (endToken || value).match(/\b(19|20)\d{2}\b/) ?? value.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  const start = parseLooseDate(startToken, year);
  let end = endToken ? parseLooseDate(endToken, year) : null;
  // "Nov 15 – 19, 2025": the end has only a day.
  const dayOnly = endToken.match(/^(\d{1,2})(?:,?\s*(19|20)\d{2})?$/);
  if (!end && start && dayOnly) {
    end = new Date(start);
    end.setDate(Number(dayOnly[1]));
  }
  // "10 – 12 Dec 2025": the start has only a day.
  let resolvedStart = start;
  if (!resolvedStart && end && /^\d{1,2}$/.test(startToken)) {
    resolvedStart = new Date(end);
    resolvedStart.setDate(Number(startToken));
  }
  return { start: resolvedStart, end: end ?? resolvedStart };
};

const formatDay = (date: Date, locale: MobileLocale, options: Intl.DateTimeFormatOptions) => {
  try {
    return date.toLocaleDateString(locale === 'sw' ? 'sw-TZ' : 'en-GB', options);
  } catch {
    return date.toDateString();
  }
};

/** The admin's date text in the app's language (English keeps it as typed). */
const localizeDateRange = (dateRange: string, start: Date | null, end: Date | null, locale: MobileLocale) => {
  if (locale === 'en' || !start) return dateRange;
  const full = (date: Date) => formatDay(date, locale, { day: 'numeric', month: 'long', year: 'numeric' });
  if (!end || end.getTime() === start.getTime()) return full(start);
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) return `${start.getDate()} – ${full(end)}`;
  const dayMonth = (date: Date) => formatDay(date, locale, { day: 'numeric', month: 'long' });
  return start.getFullYear() === end.getFullYear() ? `${dayMonth(start)} – ${full(end)}` : `${full(start)} – ${full(end)}`;
};

/* ---------------------------------------------------------------- labels */

const labels = (locale: MobileLocale) => mobileMessages[locale].common.labels as unknown as Record<string, Record<string, string>>;
const englishLabels = mobileMessages.en.common.labels as unknown as Record<string, Record<string, string>>;
const label = (locale: MobileLocale, group: string, key: string) => labels(locale)[group]?.[key] ?? englishLabels[group]?.[key];

const LEGACY_CATEGORIES: Record<string, string> = {
  residential: 'residential-retreat',
  parish: 'parish-retreat',
  special: 'special-retreat',
  'jesus-mission': 'jesus-mission-retreat',
};
const normalizeCategory = (value: string) => LEGACY_CATEGORIES[value] ?? value;
const titleCase = (value: string) => value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* -------------------------------------------------------------- retreats */

const STATUSES: RetreatStatus[] = ['Registration Open', 'Waitlist', 'Closed'];

const toRetreat = (row: Row, locale: MobileLocale, today: Date): Retreat | null => {
  const id = str(row.id);
  const slug = str(row.slug);
  const title = str(row.title);
  if (!id || !slug || !title) return null;
  const dateRange = text(row.dateRange);
  const { start, end } = parseRetreatDates(dateRange);
  const reference = end ?? start;
  const category = normalizeCategory(text(row.category));
  const status = (STATUSES.includes(row.status as RetreatStatus) ? row.status : text(row.status, 'Registration Open') || 'Registration Open') as RetreatStatus;
  return {
    id,
    slug,
    title,
    subtitle: str(row.subtitle),
    speaker: text(row.speaker),
    conductor: text(row.conductor),
    description: text(row.description),
    dateRange,
    timeRange: text(row.timeRange),
    location: text(row.location),
    availability: {
      total: num(row.availabilityTotal) ?? 0,
      male: num(row.availabilityMale) ?? 0,
      female: num(row.availabilityFemale) ?? 0,
    },
    status,
    imageSrc: str(row.imageSrc) ?? '/images/dmrc/gallery/IMG_0299.JPG',
    category,
    categoryLabel: label(locale, 'retreatCategories', category) ?? titleCase(category),
    statusLabel: label(locale, 'retreatStatus', status) ?? status,
    dateLabel: localizeDateRange(dateRange, start, end, locale),
    price: num(row.price),
    isPaid: typeof row.isPaid === 'boolean' ? row.isPaid : undefined,
    startDate: start ? start.toISOString() : null,
    endDate: end ? end.toISOString() : null,
    ended: Boolean(reference && reference < today),
  };
};

/** All retreats: upcoming soonest first, then past ones newest first. */
export async function loadRetreats(locale: MobileLocale, now = new Date()): Promise<Retreat[] | null> {
  const rows = await localize('retreat', (await selectRows('retreats')).map(camelize), locale);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const items = rows.map((row) => toRetreat(row, locale, today)).filter((item): item is Retreat => item !== null);
  if (!items.length) return null;
  const time = (value: string | null) => (value ? new Date(value).getTime() : Number.POSITIVE_INFINITY);
  const upcoming = items.filter((item) => !item.ended).sort((a, b) => time(a.startDate) - time(b.startDate));
  const past = items.filter((item) => item.ended).sort((a, b) => time(b.startDate) - time(a.startDate));
  return [...upcoming, ...past];
}

/* --------------------------------------------------------- content items */

const publishedContent = async (type: 'news' | 'publications' | 'gallery', locale: MobileLocale) =>
  localize(
    'content',
    await selectRows('content_items', {
      type: `eq.${type}`,
      status: 'eq.published',
      order: 'publishDate.desc,createdAt.desc',
    }),
    locale,
  );

const readingTime = (sections: ArticleSection[]) => {
  const words = sections.flatMap((s) => s.paragraphs).join(' ').split(/\s+/).filter(Boolean).length;
  return words ? `${Math.max(1, Math.round(words / 200))} min read` : undefined;
};

const toArticle = (row: Row): Article | null => {
  const id = str(row.id);
  const title = str(row.title);
  if (!id || !title) return null;
  const meta = obj(row.metadata);
  const paragraphs = text(row.body)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const sections = paragraphs.length ? [{ paragraphs }] : [];
  return {
    id,
    slug: str(row.slug) ?? id,
    title,
    summary: str(row.summary) ?? paragraphs[0] ?? '',
    heroImage: str(row.mediaUrl) ?? imagery.churchInterior,
    tag: str(row.category),
    publishedOn: iso(row.publishDate) ?? iso(row.createdAt),
    readingTime: str(meta.readingTime) ?? readingTime(sections),
    author: str(meta.author),
    sections,
    featuredQuote: str(meta.featuredQuote),
    featuredScripture: str(meta.featuredScripture),
    gallery: list(meta.gallery).filter((item): item is string => typeof item === 'string'),
  };
};

export async function loadNews(locale: MobileLocale): Promise<Article[] | null> {
  const items = (await publishedContent('news', locale)).map(toArticle).filter((item): item is Article => item !== null);
  return items.length ? items : null;
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const toPublication = (row: Row, locale: MobileLocale): Publication | null => {
  const id = str(row.id);
  const title = str(row.title);
  if (!id || !title) return null;
  const meta = obj(row.metadata);
  const category = str(row.category) ?? 'Books';
  const format = str(meta.format) ?? 'Paperback';
  return {
    id,
    slug: str(row.slug) ?? toSlug(title),
    title,
    subtitle: str(row.summary),
    description: text(row.body),
    author: str(meta.author) ?? 'DMRC Publications',
    category,
    format,
    categoryLabel: label(locale, 'publicationCategories', category) ?? category,
    formatLabel: label(locale, 'publicationFormats', format) ?? format,
    coverImage: str(row.mediaUrl) ?? imagery.bibleReading,
    price: num(meta.price) ?? 0,
    originalPrice: num(meta.originalPrice),
    rating: 0,
    totalReviews: 0,
    publishedOn: iso(row.publishDate) ?? iso(row.createdAt) ?? '',
    badge: str(meta.badge),
    inStock: meta.inStock === undefined || meta.inStock === null ? true : Boolean(meta.inStock),
  };
};

/** Delivery fee and order limit match the website's shop (src/lib/publications/format.ts). */
export async function loadCatalogue(locale: MobileLocale, fallback: Catalogue): Promise<Catalogue | null> {
  const items = (await publishedContent('publications', locale)).map((row) => toPublication(row, locale)).filter((item): item is Publication => item !== null);
  return items.length ? { ...fallback, items } : null;
}

const youtubeId = (value?: string) => value?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1];
const ORIENTATIONS = new Set(['landscape', 'portrait', 'square']);
const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'cd']);

const toMedia = (row: Row): GalleryMedia | null => {
  const id = str(row.id);
  if (!id) return null;
  const meta = obj(row.metadata);
  const mediaType = (MEDIA_TYPES.has(text(meta.mediaType)) ? meta.mediaType : 'image') as GalleryMedia['mediaType'];
  const src = str(row.mediaUrl) ?? str(meta.source);
  if (!src && mediaType !== 'cd') return null;
  const orientation = text(meta.orientation);
  const media: GalleryMedia = {
    id,
    mediaType,
    src: src || '#',
    title: text(row.title),
    description: str(row.summary) ?? str(row.body),
    orientation: (ORIENTATIONS.has(orientation) ? orientation : 'landscape') as GalleryMedia['orientation'],
    caption: str(row.category),
    date: iso(row.publishDate),
  };
  if (mediaType === 'video') {
    const videoId = str(meta.youtubeId) ?? youtubeId(src);
    if (videoId) {
      media.youtubeId = videoId;
      media.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
      media.poster = str(meta.poster) ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else {
      media.poster = str(meta.poster);
    }
  } else if (mediaType === 'image') {
    media.poster = str(meta.poster);
  } else {
    if (mediaType === 'cd' && !src) media.src = str(meta.storeUrl) ?? '#';
    media.duration = str(meta.duration);
    media.artist = str(meta.artist);
    media.album = str(meta.album);
    media.coverArt = str(meta.coverArt);
  }
  return media;
};

export async function loadGallery(locale: MobileLocale): Promise<Gallery | null> {
  const items = (await publishedContent('gallery', locale)).map(toMedia).filter((item): item is GalleryMedia => item !== null);
  if (!items.length) return null;
  const gallery: Gallery = { photos: [], videos: [], audio: [], cds: [] };
  for (const item of items) {
    if (item.mediaType === 'video') gallery.videos.push(item);
    else if (item.mediaType === 'audio') gallery.audio.push(item);
    else if (item.mediaType === 'cd') gallery.cds.push(item);
    else gallery.photos.push(item);
  }
  return gallery;
}

/* ------------------------------------------------------------ ministries */

const PHOTO_ROTATION = [imagery.prayerHands, imagery.community, imagery.churchInterior, imagery.bibleReading, imagery.candles, imagery.sunriseHills, imagery.cross, imagery.heroChapel];

const toMinistry = (row: Row, index: number, bundled: Ministry[]): Ministry | null => {
  const id = str(row.id);
  const slug = str(row.slug);
  const title = str(row.title);
  if (!id || !slug || !title) return null;
  const fallback = bundled.find((item) => item.slug === slug);
  const contact = obj(row.contact);
  const focusAreas = list(row.focusAreas)
    .map((item) => {
      if (typeof item === 'string') return { title: item, description: '' };
      const area = obj(item);
      return str(area.title) ? { title: text(area.title), description: text(area.description) } : null;
    })
    .filter((item): item is { title: string; description: string } => item !== null);
  const gatherings = list(row.gatherings)
    .map(obj)
    .filter((item) => str(item.day) || str(item.time))
    .map((item) => ({ day: text(item.day), time: text(item.time), description: text(item.description) }));
  const heroImage = str(row.heroImage) ?? fallback?.heroImage;
  return {
    id,
    slug,
    title,
    shortDescription: str(row.shortDescription) ?? fallback?.shortDescription ?? '',
    overview: str(row.overview) ?? fallback?.overview ?? '',
    heroImage: !heroImage || heroImage.endsWith('.svg') ? PHOTO_ROTATION[index % PHOTO_ROTATION.length] : heroImage,
    highlightScripture: str(row.highlightScripture) ?? fallback?.highlightScripture,
    focusAreas: focusAreas.length ? focusAreas : fallback?.focusAreas,
    gatherings: gatherings.length ? gatherings : fallback?.gatherings,
    contact:
      str(contact.email) || str(contact.coordinator)
        ? { coordinator: str(contact.coordinator) ?? 'Ministry coordinator', email: text(contact.email), phone: str(contact.phone) }
        : fallback?.contact,
    activities: fallback?.activities,
  };
};

export async function loadMinistries(locale: MobileLocale, bundled: Ministry[]): Promise<Ministry[] | null> {
  const rows = await localize('ministry', (await selectRows('ministries', { isActive: 'eq.true', order: 'order.asc' })).map(camelize), locale);
  const items = rows.map((row, index) => toMinistry(row, index, bundled)).filter((item): item is Ministry => item !== null);
  return items.length ? items : null;
}

/* ------------------------------------------------------------------ home */

/** Runs one part of the home screen; on failure that part keeps its bundled content. */
const part = async <T>(run: () => Promise<T | null>, fallback: T): Promise<T> => {
  try {
    return (await run()) ?? fallback;
  } catch {
    return fallback;
  }
};

export async function loadHome(locale: MobileLocale, bundled: Home, catalogue: Catalogue): Promise<Home> {
  const office = mobileMessages[locale].common.labels.officeHours;
  const [heroSlides, retreats, news, publications, gallery, testimonials] = await Promise.all([
    part(async () => {
      const rows = await localize('hero_slide', await selectRows('hero_slides', { isActive: 'eq.true', order: 'order.asc' }), locale);
      const slides = rows
        .filter((row) => str(row.id) && str(row.imageUrl))
        .map((row) => ({ id: text(row.id), imageUrl: text(row.imageUrl), title: str(row.title) ?? null, subtitle: str(row.subtitle) ?? null }));
      return slides.length ? slides : null;
    }, bundled.heroSlides),
    part(async () => (await loadRetreats(locale))?.slice(0, 6) ?? null, bundled.retreats),
    part(async () => (await loadNews(locale))?.slice(0, 5).map(({ sections: _s, gallery: _g, ...article }) => article) ?? null, bundled.news),
    part(async () => (await loadCatalogue(locale, catalogue))?.items.filter((item) => item.inStock !== false).slice(0, 8) ?? null, bundled.publications),
    part(async () => {
      const photos = (await loadGallery(locale))?.photos ?? [];
      const preview = photos.filter((item) => item.src && item.src !== '#').slice(0, 8).map(({ id, src, title }) => ({ id, src, title }));
      return preview.length ? preview : null;
    }, bundled.gallery),
    part(async () => {
      const rows = await localize('testimonial', await selectRows('testimonials', { isActive: 'eq.true', order: 'order.asc' }), locale);
      const items = rows
        .filter((row) => str(row.id) && str(row.quote))
        .map((row) => ({ id: text(row.id), name: text(row.name), role: text(row.role), imageUrl: text(row.imageUrl), quote: text(row.quote) }));
      return items.length ? items : null;
    }, bundled.testimonials),
  ]);
  return {
    site: { ...bundled.site, contact: { ...bundled.site.contact, officeHours: [office.weekdays, office.saturday] } },
    heroSlides,
    retreats,
    news,
    publications,
    gallery,
    testimonials,
  };
}

/* ------------------------------------------------------- interface text */

/** Interface text the admin changed for the mobile app in one language. */
export async function loadUiOverrides(locale: MobileLocale): Promise<Record<string, string>> {
  const rows = await selectRows('ui_translations', { select: 'key,value', scope: 'eq.mobile', locale: `eq.${locale}` });
  const out: Record<string, string> = {};
  for (const row of rows) {
    const key = str(row.key);
    const value = str(row.value);
    if (key && value) out[key] = value;
  }
  return out;
}
