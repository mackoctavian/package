import { getArticles } from '@/lib/news/queries'
import { mobileJson, mobileOptions } from '@/lib/mobile/respond'

/** Published news stories (full text) for the mobile app, newest first. */
export const GET = async (request: Request) => mobileJson(request, await getArticles())

export const OPTIONS = mobileOptions
