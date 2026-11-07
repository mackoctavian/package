'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { useT } from '@/i18n/client'
import { Link } from '@/i18n/link'

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT()
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className='container max-w-2xl py-24 text-center'>
      <p className='eyebrow justify-center'>{t('pages.error.eyebrow')}</p>
      <h1 className='mt-3 text-5xl'>{t('pages.error.title')}</h1>
      <p className='mt-4 text-lg text-muted-foreground'>{t('pages.error.text')}</p>
      <div className='mt-8 flex flex-wrap justify-center gap-3'>
        <Button size='pill' onClick={reset}>
          <RefreshCw className='mr-2 h-4 w-4' /> {t('common.actions.tryAgain')}
        </Button>
        <Button asChild variant='outline' size='pill'>
          <Link href='/'>{t('common.actions.backHome')}</Link>
        </Button>
      </div>
    </main>
  )
}
