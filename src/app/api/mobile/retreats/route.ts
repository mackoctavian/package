import { getAllRetreats } from '@/lib/retreats/queries'
import { mobileJson, mobileOptions } from '@/lib/mobile/respond'
import { toMobileRetreats } from '@/lib/mobile/retreats'

/** All retreats for the mobile app, upcoming first. Bookings are never included. */
export const GET = async (request: Request) => {
  const { retreats } = await getAllRetreats()
  return mobileJson(request, toMobileRetreats(retreats))
}

export const OPTIONS = mobileOptions
