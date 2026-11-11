import { getPublications } from '@/lib/publications/queries'
import { DELIVERY_FEE, MAX_QUANTITY } from '@/lib/publications/format'
import { withPublicationLabels } from '@/lib/mobile/labels'
import { mobileJson, mobileLocale, mobileOptions } from '@/lib/mobile/respond'

/** Bookshop catalogue for the mobile app. */
export const GET = async (request: Request) => {
  const locale = mobileLocale(request)
  const items = withPublicationLabels(await getPublications(locale), locale)
  return mobileJson(request, { items, deliveryFee: DELIVERY_FEE, maxQuantity: MAX_QUANTITY, currency: 'TZS' }, locale)
}

export const OPTIONS = mobileOptions
