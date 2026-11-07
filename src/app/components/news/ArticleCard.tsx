'use client'

import { Link } from '@/i18n/link'
import { useLocale, useT } from '@/i18n/client'
import { ArrowRight } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import { formatArticleDate, formatReadingTime, type Article } from '@/lib/news/format'

export default function ArticleCard({ article }: { article: Article }) {
  const t = useT()
  const locale = useLocale()
  return (
    <article className='group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift'>
      <div className='relative aspect-[16/10] overflow-hidden'>
        <SmartImage
          src={article.heroImage}
          alt=''
          fill
          sizes='(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
          className='object-cover transition-transform duration-700 group-hover:scale-105'
        />
        {article.tag && (
          <span className='absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy-800'>{article.tag}</span>
        )}
      </div>
      <div className='flex flex-1 flex-col p-6'>
        <p className='text-xs font-medium text-gold-700'>{[formatArticleDate(article.publishedOn, locale), formatReadingTime(article.readingTime, t)].filter(Boolean).join(' · ')}</p>
        <h3 className='mt-2 font-display text-2xl font-semibold leading-snug text-navy-900'>
          <Link href={`/news/${article.slug}`} className='after:absolute after:inset-0 focus-visible:outline-none'>
            {article.title}
          </Link>
        </h3>
        <p className='mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground'>{article.summary}</p>
        <span className='mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900'>
          {t('news.readStory')} <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
        </span>
      </div>
    </article>
  )
}
