import { getUiOverrides } from '@/i18n/server'
import { mobileJson, mobileLocale, mobileOptions } from '@/lib/mobile/respond'

/**
 * Interface text the admin has changed for the mobile app, for one language.
 * The app ships its own built-in English and Swahili text and lays these
 * overrides on top, so it works offline and only downloads what changed.
 */
export const GET = async (request: Request) => {
  const locale = mobileLocale(request)
  const messages = await getUiOverrides('mobile', locale)
  return mobileJson(request, { locale, messages }, locale)
}

export const OPTIONS = mobileOptions
