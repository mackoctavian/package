import { getMinistries } from '@/lib/ministries/queries'
import { mobileJson, mobileOptions } from '@/lib/mobile/respond'

/** Active ministries for the mobile app. */
export const GET = async (request: Request) => mobileJson(request, await getMinistries())

export const OPTIONS = mobileOptions
