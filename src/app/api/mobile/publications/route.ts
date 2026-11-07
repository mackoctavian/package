import { getPublications } from '@/lib/publications/queries'
import { DELIVERY_FEE, MAX_QUANTITY } from '@/lib/publications/format'
import { mobileJson, mobileOptions } from '@/lib/mobile/respond'

/** Bookshop catalogue for the mobile app. */
export const GET = async (request: Request) => {
  const items = await getPublications()
  return mobileJson(request, { items, deliveryFee: DELIVERY_FEE, maxQuantity: MAX_QUANTITY, currency: 'TZS' })
}

export const OPTIONS = mobileOptions
