import { getArticles } from '@/lib/news/queries'
import { mobileJson, mobileLocale, mobileOptions } from '@/lib/mobile/respond'

/** Published news stories (full text) for the mobile app, newest first. */
export const GET = async (request: Request) => {
  const locale = mobileLocale(request)
  return mobileJson(request, await getArticles(locale), locale)
}

export const OPTIONS = mobileOptions
