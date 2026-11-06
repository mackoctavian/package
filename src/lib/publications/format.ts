import type { PublicationType } from '@/app/types/publication'

/** Shared by server pages and client components. */

export type Publication = PublicationType & { slug: string }

export const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export const formatTZS = (value: number) => `TZS ${Math.round(value).toLocaleString('en-US')}`

export const DELIVERY_FEE = 6000
export const MAX_QUANTITY = 8
