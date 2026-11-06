'use client'

import { useMemo, useState } from 'react'

import ArticleCard from '@/app/components/news/ArticleCard'
import type { Article } from '@/lib/news/format'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 9

export default function NewsExplorer({ articles }: { articles: Article[] }) {
  const tags = useMemo(() => Array.from(new Set(articles.map((a) => a.tag).filter(Boolean))) as string[], [articles])
  const [tag, setTag] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = tag ? articles.filter((a) => a.tag === tag) : articles

  if (!articles.length) {
    return <p className='rounded-3xl border border-dashed border-border bg-white p-12 text-center text-muted-foreground'>More stories are on their way.</p>
  }

  return (
    <div>
      {tags.length > 1 && (
        <div className='flex flex-wrap gap-2' role='group' aria-label='Filter stories by topic'>
          {[null, ...tags].map((value) => (
            <button
              key={value ?? 'all'}
              type='button'
              aria-pressed={tag === value}
              onClick={() => {
                setTag(value)
                setVisible(PAGE_SIZE)
              }}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                tag === value ? 'border-navy-900 bg-navy-900 text-white' : 'border-border bg-white text-navy-800 hover:border-navy-300',
              )}
            >
              {value ?? 'All stories'}
            </button>
          ))}
        </div>
      )}
      <div className='mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {filtered.slice(0, visible).map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      {filtered.length > visible && (
        <div className='mt-10 text-center'>
          <button
            type='button'
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className='rounded-full border border-navy-900 px-6 py-3 text-sm font-semibold text-navy-900 transition hover:bg-navy-900 hover:text-white'
          >
            Load more stories
          </button>
        </div>
      )}
    </div>
  )
}
