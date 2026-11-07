import { getAllRetreats } from '@/lib/retreats/queries'
import { getArticles } from '@/lib/news/queries'
import { getPublications } from '@/lib/publications/queries'
import { getGalleryPreview, getHeroSlides, getTestimonials } from '@/lib/site/homepage'
import { siteConfig } from '@/app/data/site'
import { getT } from '@/i18n/server'
import { mobileJson, mobileLocale, mobileOptions } from '@/lib/mobile/respond'
import { withPublicationLabels } from '@/lib/mobile/labels'
import { omit, toMobileRetreats } from '@/lib/mobile/retreats'

/** Everything the app's home screen needs in one request. */
export const GET = async (request: Request) => {
  const locale = mobileLocale(request)
  const [t, heroSlides, { retreats }, articles, publications, gallery, testimonials] = await Promise.all([
    getT(locale),
    getHeroSlides(locale),
    getAllRetreats(locale),
    getArticles(locale),
    getPublications(locale),
    getGalleryPreview(locale, 8),
    getTestimonials(locale),
  ])

  return mobileJson(request, {
    site: {
      ...omit(siteConfig, ['url']),
      // Office hours are interface text, so they follow the requested language.
      contact: { ...siteConfig.contact, officeHours: [t('common.officeHours.weekdays'), t('common.officeHours.saturday')] },
    },
    heroSlides,
    retreats: toMobileRetreats(retreats, locale).slice(0, 6),
    news: articles.slice(0, 5).map((article) => omit(article, ['sections', 'gallery'])),
    publications: withPublicationLabels(publications.filter((item) => item.inStock !== false).slice(0, 8), locale),
    gallery,
    testimonials,
  }, locale)
}

export const OPTIONS = mobileOptions
