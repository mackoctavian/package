import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'

import { newsItems, pressMentions } from '@/app/data/news'

export const metadata: Metadata = {
  title: 'News & Events | Divine Mercy Retreat Center',
  description:
    'Stay up to date with announcements, testimonies, and upcoming events at Divine Mercy Retreat Center.',
}

const formatDate = (isoDate: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoDate))
}

const NewsPage = () => {
  const sortedArticles = [...newsItems].sort(
    (a, b) => new Date(b.publishedOn).getTime() - new Date(a.publishedOn).getTime()
  )

  // Featured article (first one)
  const featuredArticle = sortedArticles[0]
  const remainingArticles = sortedArticles.slice(1)

  return (
    <main>
      {/* Hero Section */}
      <section className='relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-32 text-white'>
        <div className='pointer-events-none absolute inset-0'>
          <Image
            src='https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=2000&q=60'
            alt=''
            fill
            className='object-cover object-center opacity-20'
            priority
          />
          <div className='absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-slate-900/90 to-slate-950' />
          <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.15),_transparent_60%)]' />
        </div>
        <div className='relative container mx-auto max-w-5xl px-4 text-center space-y-6'>
          <span className='inline-flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/90'>
            ✦ News & Updates
          </span>
          <h1 className='text-4xl font-bold sm:text-5xl lg:text-6xl leading-tight'>
            Stories of Mercy & Mission
          </h1>
          <p className='text-lg text-white/70 max-w-2xl mx-auto leading-relaxed'>
            Discover how the Lord is moving through our ministries—read the latest announcements, testimonies, and
            stories from the heart of DMRC.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className='bg-white py-16 sm:py-20'>
          <div className='container mx-auto max-w-6xl px-4'>
            <article className='group relative overflow-hidden rounded-3xl bg-slate-900'>
              <div className='grid lg:grid-cols-2'>
                <div className='relative h-80 lg:h-auto overflow-hidden'>
                  <Image
                    src={featuredArticle.heroImage}
                    alt={featuredArticle.title}
                    fill
                    className='object-cover transition duration-700 group-hover:scale-105'
                  />
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-slate-900/20 to-slate-900 lg:block hidden' />
                  <div className='absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent lg:hidden' />
                </div>
                <div className='relative p-8 lg:p-12 flex flex-col justify-center'>
                  <div className='absolute top-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-3xl' />
                  <span className='inline-flex w-fit items-center rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white mb-6'>
                    Featured
                  </span>
                  <span className='text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-3'>
                    {formatDate(featuredArticle.publishedOn)} · {featuredArticle.readingTime}
                  </span>
                  <h2 className='text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight'>
                    <Link href={`/news/${featuredArticle.slug}`} className='hover:text-indigo-300 transition-colors'>
                      {featuredArticle.title}
                    </Link>
                  </h2>
                  <p className='text-white/70 text-lg leading-relaxed mb-6'>
                    {featuredArticle.summary}
                  </p>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-indigo-400'>By {featuredArticle.author}</span>
                    <Link
                      href={`/news/${featuredArticle.slug}`}
                      className='inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-full font-semibold text-sm hover:bg-indigo-100 transition-colors'
                    >
                      Read Full Story
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* All Articles Grid */}
      <section className='bg-slate-50 py-16 sm:py-20'>
        <div className='container mx-auto max-w-6xl px-4'>
          <div className='flex items-center justify-between mb-10'>
            <div>
              <h2 className='text-3xl font-bold text-slate-900'>Latest News</h2>
              <p className='text-slate-600 mt-1'>Stories from the Divine Mercy community</p>
            </div>
            <span className='text-sm font-medium text-slate-500'>{remainingArticles.length} articles</span>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {remainingArticles.map((article) => (
              <article
                key={article.id}
                className='group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300'
              >
                <div className='relative h-56 overflow-hidden'>
                  <Image
                    src={article.heroImage}
                    alt={article.title}
                    fill
                    className='object-cover transition duration-500 group-hover:scale-110'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent' />
                  <div className='absolute top-4 left-4'>
                    <span className='rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white'>
                      {article.tag}
                    </span>
                  </div>
                </div>
                <div className='p-6 space-y-4'>
                  <div className='flex items-center gap-3 text-xs font-medium text-slate-500'>
                    <span>{formatDate(article.publishedOn)}</span>
                    <span className='w-1 h-1 rounded-full bg-slate-300' />
                    <span>{article.readingTime}</span>
                  </div>
                  <h3 className='text-xl font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors'>
                    <Link href={`/news/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>
                  <p className='text-slate-600 text-sm line-clamp-2'>{article.summary}</p>
                  <div className='flex items-center justify-between pt-2'>
                    <span className='text-xs font-semibold text-indigo-600'>By {article.author}</span>
                    <Link
                      href={`/news/${article.slug}`}
                      className='text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1'
                    >
                      Read →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Press Mentions */}
      {pressMentions.length > 0 && (
        <section className='bg-white py-16 sm:py-20'>
          <div className='container mx-auto max-w-5xl px-4'>
            <div className='text-center mb-12'>
              <span className='inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full text-xs font-semibold uppercase tracking-wider text-slate-600 mb-4'>
                In The Press
              </span>
              <h2 className='text-3xl font-bold text-slate-900'>Media Coverage</h2>
              <p className='text-slate-600 mt-2'>Read how the wider Church is covering DMRC's mission.</p>
            </div>

            <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {pressMentions.map((mention) => (
                <Link
                  key={mention.id}
                  href={mention.url}
                  target='_blank'
                  rel='noreferrer'
                  className='group block p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300'
                >
                  <p className='text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-3'>
                    {mention.outlet}
                  </p>
                  <h3 className='font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-3'>
                    {mention.title}
                  </h3>
                  <p className='text-xs text-slate-500'>{formatDate(mention.publishedOn)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className='bg-gradient-to-br from-indigo-600 to-purple-700 py-16 sm:py-20'>
        <div className='container mx-auto max-w-3xl px-4 text-center space-y-6'>
          <h2 className='text-3xl font-bold text-white'>Share Your Story</h2>
          <p className='text-white/80 text-lg'>
            We would love to hear how Divine Mercy Retreat Center has impacted you. Submit testimonies, event updates,
            or mission stories to our communications team.
          </p>
          <a
            href='mailto:communications@dmrc.org'
            className='inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-indigo-600 transition hover:bg-indigo-50 hover:shadow-xl'
          >
            Email Communications
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </main>
  )
}

export default NewsPage
