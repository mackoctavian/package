export type PublicationFormat = 'Hardcover' | 'Paperback' | 'Digital' | 'Audio' | 'Video' | 'CD' | 'Calendar'

export type PublicationCategory =
  | 'Bible'
  | 'Books'
  | 'CDs'
  | 'Calendars'

export interface PublicationType {
  id: string
  title: string
  subtitle?: string
  description: string
  author: string
  category: PublicationCategory
  format: PublicationFormat
  coverImage: string
  price: number
  originalPrice?: number
  rating: number
  totalReviews: number
  publishedOn: string
  badge?: string
  inStock?: boolean
  soldCount?: number
}
