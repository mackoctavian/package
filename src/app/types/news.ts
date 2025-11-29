export type NewsTag = 'Announcement' | 'Event' | 'Testimony' | 'Press'

export type NewsContentSection = {
  heading?: string
  paragraphs: string[]
}

export type NewsItem = {
  id: string
  slug: string
  title: string
  summary: string
  publishedOn: string
  author: string
  heroImage: string
  tag: NewsTag
  readingTime: string
  content: NewsContentSection[]
  featuredQuote?: string
  featuredScripture?: string
}

export type EventHighlight = {
  id: string
  title: string
  dateRange: string
  location: string
  description: string
  ctaLabel: string
  ctaHref: string
}

export type PressMention = {
  id: string
  outlet: string
  title: string
  url: string
  publishedOn: string
}

