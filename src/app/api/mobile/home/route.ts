import { getAllRetreats } from '@/lib/retreats/queries'
import { getArticles } from '@/lib/news/queries'
import { getPublications } from '@/lib/publications/queries'
import { getGalleryPreview, getHeroSlides, getTestimonials } from '@/lib/site/homepage'
import { siteConfig } from '@/app/data/site'
import { mobileJson, mobileOptions } from '@/lib/mobile/respond'
import { omit, toMobileRetreats } from '@/lib/mobile/retreats'

/** Everything the app's home screen needs in one request. */
export const GET = async (request: Request) => {
  const [heroSlides, { retreats }, articles, publications, gallery, testimonials] = await Promise.all([
    getHeroSlides(),
    getAllRetreats(),
    getArticles(),
    getPublications(),
    getGalleryPreview(8),
    getTestimonials(),
  ])


  return mobileJson(request, {
    site: omit(siteConfig, ['url']),
    heroSlides,
    retreats: toMobileRetreats(retreats).slice(0, 6),
    news: articles.slice(0, 5).map((article) => omit(article, ['sections', 'gallery'])),
    publications: publications.filter((item) => item.inStock !== false).slice(0, 8),
    gallery,
    testimonials,
  })
}

export const OPTIONS = mobileOptions
