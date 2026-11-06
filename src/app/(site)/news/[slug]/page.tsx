import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, CalendarDays, Quote } from 'lucide-react'

import ArticleCard from '@/app/components/news/ArticleCard'
import SmartImage from '@/app/components/site/SmartImage'
import { Button } from '@/app/components/ui/button'
import { siteConfig } from '@/app/data/site'
import { formatArticleDate, getArticleBySlug, getArticles } from '@/lib/news/queries'
import { getAllRetreats } from '@/lib/retreats/queries'
import { formatRetreatMonthDay, getUpcomingRetreats } from '@/lib/retreats/dates'

export const revalidate = 300

type NewsRouteProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: NewsRouteProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return { title: 'Story not found' }
  return {
    title: article.title,
    description: article.summary,
    openGraph: { title: article.title, description: article.summary, images: [article.heroImage], type: 'article', publishedTime: article.publishedOn },
  }
}

export default async function NewsDetailPage({ params }: NewsRouteProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const [articles, { retreats }] = await Promise.all([getArticles(), getAllRetreats()])
  const related = articles.filter((item) => item.slug !== slug).slice(0, 3)
  const upcoming = getUpcomingRetreats(retreats.filter((r) => r.status !== 'Closed')).slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: [article.heroImage],
    datePublished: article.publishedOn,
    author: { '@type': 'Organization', name: article.author || siteConfig.name },
    publisher: { '@type': 'Organization', name: siteConfig.name },
  }

  return (
    <main>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className='bg-ivory !pb-10'>
        <div className='container max-w-4xl'>
          <Link href='/news' className='inline-flex items-center gap-2 text-sm font-medium text-gold-700 hover:text-gold-600'>
            <ArrowLeft className='h-4 w-4' /> All stories
          </Link>
          {article.tag && <p className='eyebrow mt-8'>{article.tag}</p>}
          <h1 className='mt-3 text-5xl leading-[1.05] sm:text-6xl'>{article.title}</h1>
          {article.summary && <p className='mt-5 text-xl leading-relaxed text-muted-foreground'>{article.summary}</p>}
          <p className='mt-6 text-sm text-navy-700'>
            {[article.author || 'DMRC Communications', formatArticleDate(article.publishedOn), article.readingTime].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className='container mt-10 max-w-6xl'>
          <div className='relative aspect-[21/9] overflow-hidden rounded-[2rem]'>
            <SmartImage src={article.heroImage} alt='' fill priority sizes='100vw' className='object-cover' />
          </div>
        </div>
      </section>

      <section className='!pt-6'>
        <div className='container grid max-w-6xl gap-12 lg:grid-cols-12'>
          <article className='lg:col-span-8'>
            {article.featuredScripture && (
              <p className='mb-8 border-l-4 border-gold-400 pl-5 font-display text-2xl italic leading-snug text-navy-800'>{article.featuredScripture}</p>
            )}
            <div className='space-y-10 text-lg leading-relaxed text-navy-800'>
              {article.sections.map((section, index) => (
                <div key={`${section.heading ?? 'section'}-${index}`} className='space-y-5'>
                  {section.heading && <h2 className='text-3xl'>{section.heading}</h2>}
                  {section.paragraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                  {index === 0 && article.featuredQuote && (
                    <figure className='my-8 rounded-[2rem] bg-navy-900 p-8 text-white'>
                      <Quote className='h-7 w-7 text-gold-400' />
                      <blockquote className='mt-3 font-display text-2xl leading-snug'>{article.featuredQuote}</blockquote>
                    </figure>
                  )}
                </div>
              ))}
            </div>

            {article.gallery.length > 0 && (
              <div className='mt-10 grid gap-4 sm:grid-cols-2'>
                {article.gallery.map((image, index) => (
                  <div key={`${image}-${index}`} className='relative aspect-[4/3] overflow-hidden rounded-2xl'>
                    <SmartImage src={image} alt='' fill sizes='(min-width: 640px) 50vw, 100vw' className='object-cover' />
                  </div>
                ))}
              </div>
            )}
          </article>

          <aside className='lg:col-span-4'>
            <div className='space-y-6 lg:sticky lg:top-28'>
              {upcoming.length > 0 && (
                <div className='rounded-[2rem] border border-border bg-white p-7'>
                  <h2 className='flex items-center gap-2 font-display text-2xl font-semibold text-navy-900'>
                    <CalendarDays className='h-5 w-5 text-gold-500' /> Coming up at DMRC
                  </h2>
                  <ul className='mt-5 space-y-4'>
                    {upcoming.map(({ retreat, dates }) => {
                      const date = formatRetreatMonthDay(dates.start)
                      return (
                        <li key={retreat.id}>
                          <Link href={retreat.detailHref || `/events/${retreat.slug}`} className='group flex gap-4'>
                            <span className='flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-parchment'>
                              <span className='text-[10px] font-semibold tracking-widest text-gold-700'>{date?.month ?? 'TBA'}</span>
                              <span className='font-display text-xl font-bold leading-none text-navy-900'>{date?.day ?? ''}</span>
                            </span>
                            <span>
                              <span className='block font-semibold leading-snug text-navy-900 group-hover:underline'>{retreat.title}</span>
                              <span className='text-xs text-muted-foreground'>{retreat.dateRange}</span>
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                  <Button asChild variant='outline' size='pill' className='mt-6 w-full'>
                    <Link href='/retreats'>All retreats</Link>
                  </Button>
                </div>
              )}
              <div className='rounded-[2rem] bg-parchment p-7'>
                <h2 className='font-display text-2xl font-semibold text-navy-900'>Support this work</h2>
                <p className='mt-2 text-sm text-muted-foreground'>Stories like this are made possible by benefactors who keep the doors of DMRC open.</p>
                <Button asChild variant='gold' size='pill' className='mt-5 w-full'>
                  <Link href='/donation'>Give online</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className='bg-parchment/60'>
          <div className='container'>
            <div className='flex items-end justify-between gap-6'>
              <h2 className='text-4xl'>More stories</h2>
              <Link href='/news' className='hidden items-center gap-1.5 text-sm font-semibold text-navy-900 sm:inline-flex'>
                View all <ArrowRight className='h-4 w-4' />
              </Link>
            </div>
            <div className='mt-8 grid gap-6 md:grid-cols-3'>
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
