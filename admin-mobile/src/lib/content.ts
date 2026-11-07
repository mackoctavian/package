import type { IconName } from '@/components/ui';
import type { ContentType } from './types';

export const CONTENT_LABELS: Record<ContentType, { plural: string; singular: string; icon: IconName }> = {
  publications: { plural: 'Publications', singular: 'publication', icon: 'book-outline' },
  news: { plural: 'News', singular: 'story', icon: 'newspaper-outline' },
  events: { plural: 'Events', singular: 'event', icon: 'calendar-outline' },
  articles: { plural: 'Articles', singular: 'article', icon: 'document-text-outline' },
};

export const PUBLICATION_FORMATS = ['Paperback', 'Hardcover', 'Digital', 'Audio', 'Video', 'CD', 'Calendar'] as const;
