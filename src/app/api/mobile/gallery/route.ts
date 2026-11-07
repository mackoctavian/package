import { getGallery } from '@/lib/gallery/queries'
import { mobileJson, mobileOptions } from '@/lib/mobile/respond'

/** Photos, videos, audio and CDs for the mobile app gallery. */
export const GET = async (request: Request) => mobileJson(request, await getGallery())

export const OPTIONS = mobileOptions
