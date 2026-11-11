/** Article types and formatting shared by server pages and client components. */

export type ArticleSection = { heading?: string; paragraphs: string[] }

export type Article = {
  id: string
  slug: string
  title: string
  summary: string
  heroImage: string
  tag?: string
  publishedOn?: string
  readingTime?: string
  author?: string
  sections: ArticleSection[]
  featuredQuote?: string
  featuredScripture?: string
  gallery: string[]
}

export const formatArticleDate = (iso?: string, locale: 'en' | 'sw' = 'en') =>
  iso
    ? new Intl.DateTimeFormat(locale === 'sw' ? 'sw-TZ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
    : ''

/** "5 min read" in the visitor's language (reading times are stored in English). */
export const formatReadingTime = (
  readingTime: string | undefined,
  t: { dynamic: (key: string, values?: Record<string, number>, fallback?: string) => string },
) => {
  const minutes = Number(readingTime?.match(/\d+/)?.[0])
  return minutes ? t.dynamic('news.readingTime', { count: minutes }, readingTime) : readingTime
}
