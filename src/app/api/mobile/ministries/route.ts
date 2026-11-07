import { getMinistries } from '@/lib/ministries/queries'
import { mobileJson, mobileLocale, mobileOptions } from '@/lib/mobile/respond'

/** Active ministries for the mobile app, in the requested language. */
export const GET = async (request: Request) => {
  const locale = mobileLocale(request)
  return mobileJson(request, await getMinistries(locale), locale)
}

export const OPTIONS = mobileOptions
