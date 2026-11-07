import { getAllRetreats } from '@/lib/retreats/queries'
import { mobileJson, mobileLocale, mobileOptions } from '@/lib/mobile/respond'
import { toMobileRetreats } from '@/lib/mobile/retreats'

/** All retreats for the mobile app, upcoming first. Bookings are never included. */
export const GET = async (request: Request) => {
  const locale = mobileLocale(request)
  const { retreats } = await getAllRetreats(locale)
  return mobileJson(request, toMobileRetreats(retreats, locale), locale)
}

export const OPTIONS = mobileOptions
