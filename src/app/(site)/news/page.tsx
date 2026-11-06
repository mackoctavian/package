import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'

import NewsExplorer from '@/app/components/news/NewsExplorer'
import PageHero from '@/app/components/site/PageHero'
import SmartImage from '@/app/components/site/SmartImage'
import { Button } from '@/app/components/ui/button'
import { imagery, siteConfig } from '@/app/data/site'
import { formatArticleDate, getArticles } from '@/lib/news/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'News & events',
  description: 'Announcements, testimonies and stories from the Divine Mercy Retreat Center.',
}

export default async function NewsPage() {
  const articles = await getArticles()
  const [featured, ...rest] = articles

  return (
    <main>
      <PageHero
        eyebrow='News & events'
        title='Stories of mercy and mission'
        image={imagery.candles}
        description='Announcements, testimonies and stories of how the Lord is moving through the life of DMRC.'
      />

      {featured && (
        <section className='!pb-0'>
          <div className='container'>
            <article className='group relative grid overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft lg:grid-cols-2'>
              <div className='relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[420px]'>
                <SmartImage src={featured.heroImage} alt='' fill priority sizes='(min-width: 1024px) 50vw, 100vw' className='object-cover transition-transform duration-700 group-hover:scale-105' />
              </div>
              <div className='flex flex-col justify-center p-8 sm:p-12'>
                <p className='eyebrow'>Latest{featured.tag ? ` · ${featured.tag}` : ''}</p>
                <h2 className='mt-4 text-4xl leading-tight sm:text-5xl'>
                  <Link href={`/news/${featured.slug}`} className='after:absolute after:inset-0 focus-visible:outline-none'>
                    {featured.title}
                  </Link>
                </h2>
                <p className='mt-4 text-lg leading-relaxed text-muted-foreground'>{featured.summary}</p>
                <p className='mt-6 text-sm text-navy-700'>
                  {[formatArticleDate(featured.publishedOn), featured.readingTime, featured.author].filter(Boolean).join(' · ')}
                </p>
                <span className='mt-8 inline-flex items-center gap-1.5 font-semibold text-navy-900'>
                  Read the full story <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                </span>
              </div>
            </article>
          </div>
        </section>
      )}

      <section>
        <div className='container'>
          <h2 className='mb-8 text-4xl'>More stories</h2>
          <NewsExplorer articles={rest} />
        </div>
      </section>

      <section className='!pt-0'>
        <div className='container'>
          <div className='rounded-[2rem] bg-parchment px-8 py-12 text-center sm:px-12'>
            <h2 className='text-4xl'>Share your testimony</h2>
            <p className='mx-auto mt-3 max-w-xl text-muted-foreground'>
              Has God touched your life through a retreat or ministry at DMRC? We would love to hear your story.
            </p>
            <Button asChild size='pill' className='mt-6'>
              <a href={`mailto:${siteConfig.contact.email}?subject=My%20testimony`}>
                <Mail className='mr-2 h-4 w-4' /> Send your story
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
