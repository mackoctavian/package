import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { eventHighlights, newsItems } from '@/app/data/news'

type NewsRouteProps = {
  params: {
    slug: string
  }
}

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoDate))

export const generateStaticParams = () =>
  newsItems.map((item) => ({
    slug: item.slug,
  }))

export const generateMetadata = ({ params }: NewsRouteProps): Metadata => {
  const article = newsItems.find((item) => item.slug === params.slug)

  if (!article) {
    return {
      title: 'News Story Not Found | DMRC',
    }
  }

  return {
    title: `${article.title} | Divine Mercy Retreat Center`,
    description: article.summary,
  }
}

const NewsDetailPage = ({ params }: NewsRouteProps) => {
  const article = newsItems.find((item) => item.slug === params.slug)

  if (!article) {
    notFound()
  }

  const otherArticles = newsItems.filter((item) => item.slug !== article.slug).slice(0, 3)

  return (
    <main>
      <section className='relative overflow-hidden bg-slate-950 py-32 text-white'>
        <div className='pointer-events-none absolute inset-0'>
          <Image
            src={article.heroImage}
            alt={article.title}
            fill
            className='object-cover object-center opacity-40'
            priority
          />
          <div className='absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]' />
        </div>
        <div className='relative container mx-auto max-w-3xl px-4 space-y-6 text-center'>
          <span className='inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80'>
            {article.tag}
          </span>
          <h1 className='text-4xl font-semibold sm:text-5xl'>{article.title}</h1>
          <p className='text-sm font-semibold uppercase tracking-[0.3em] text-primary/70'>
            {formatDate(article.publishedOn)} · {article.readingTime} · By {article.author}
          </p>
          <p className='text-base text-white/80 sm:text-lg'>{article.summary}</p>
        </div>
      </section>

      <section className='bg-gray-50 py-16 sm:py-20'>
        <div className='container mx-auto max-w-6xl px-4 grid gap-12 lg:grid-cols-[2.1fr_0.9fr]'>
          <article className='space-y-10'>
            {article.featuredScripture ? (
              <blockquote className='rounded-3xl border border-primary/20 bg-white p-8 text-center text-base italic text-primary shadow-[0_18px_44px_rgba(59,130,246,0.12)]'>
                {article.featuredScripture}
              </blockquote>
            ) : null}

            {article.featuredQuote ? (
              <blockquote className='rounded-3xl border-l-4 border-primary bg-white p-6 text-lg italic text-slate-700 shadow-[0_18px_44px_rgba(15,23,42,0.08)]'>
                {article.featuredQuote}
              </blockquote>
            ) : null}

            {article.content.map((section, index) => (
              <section key={`${section.heading ?? 'section'}-${index}`} className='space-y-4'>
                {section.heading ? (
                  <h2 className='text-2xl font-semibold text-slate-900'>{section.heading}</h2>
                ) : null}
                <div className='space-y-4 text-base leading-7 text-slate-700'>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <div className='flex flex-wrap items-center gap-3 pt-6'>
              <Link
                href='/news'
                className='inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-primary/90'
              >
                Back to News
                <span aria-hidden>→</span>
              </Link>
              <Link
                href='/events/youth-revival-retreat'
                className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary transition hover:border-primary hover:bg-primary/20'
              >
                Upcoming Events
              </Link>
            </div>
          </article>

          <aside className='space-y-10'>
            <div className='rounded-3xl border border-primary/20 bg-white p-8 shadow-[0_18px_44px_rgba(59,130,246,0.12)]'>
              <h3 className='text-xl font-semibold text-slate-900'>Upcoming Events</h3>
              <div className='mt-5 space-y-5'>
                {eventHighlights.slice(0, 2).map((event) => (
                  <div key={event.id} className='rounded-2xl border border-primary/10 bg-primary/5 p-5'>
                    <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary/70'>DMRC Event</p>
                    <h4 className='mt-2 text-lg font-semibold text-slate-900'>{event.title}</h4>
                    <p className='text-sm font-medium text-primary'>{event.dateRange}</p>
                    <p className='text-sm text-slate-600'>{event.location}</p>
                    <Link
                      href={event.ctaHref}
                      className='mt-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary transition hover:text-primary/80'
                    >
                      {event.ctaLabel}
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className='space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_55px_rgba(15,23,42,0.1)]'>
              <h3 className='text-xl font-semibold text-slate-900'>More Stories</h3>
              <div className='space-y-4'>
                {otherArticles.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className='block rounded-2xl border border-slate-200 bg-slate-100/60 p-4 transition hover:border-primary hover:bg-primary/10'
                  >
                    <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary/70'>{item.tag}</p>
                    <p className='mt-2 text-sm font-semibold text-slate-900'>{item.title}</p>
                    <p className='text-xs text-slate-500'>{formatDate(item.publishedOn)}</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className='bg-primary/10 py-16 sm:py-20'>
        <div className='container mx-auto max-w-5xl px-4 text-center space-y-6'>
          <h2 className='text-3xl font-semibold text-slate-900'>Share a Testimony or Story Idea</h2>
          <p className='text-base text-slate-600'>
            We would love to hear how Divine Mercy Retreat Center has impacted you. Submit testimonies, event updates,
            or mission stories to our communications team.
          </p>
          <a
            href='mailto:communications@dmrc.org'
            className='inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-primary/90'
          >
            Email Communications
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </main>
  )
}

export default NewsDetailPage

