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

export const formatArticleDate = (iso?: string) =>
  iso ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : ''
