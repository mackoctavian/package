import { getGallery } from '@/lib/gallery/queries'
import { mobileJson, mobileLocale, mobileOptions } from '@/lib/mobile/respond'

/** Photos, videos, audio and CDs for the mobile app gallery. */
export const GET = async (request: Request) => {
  const locale = mobileLocale(request)
  return mobileJson(request, await getGallery(locale), locale)
}

export const OPTIONS = mobileOptions
