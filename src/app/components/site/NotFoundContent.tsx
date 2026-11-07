import { Compass } from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { Link } from '@/i18n/link'
import { getT } from '@/i18n/server'

/** The body of the 404 page, in the visitor's language. */
export default async function NotFoundContent() {
  const t = await getT()
  const suggestions = [
    { label: t('pages.notFound.retreats'), href: '/retreats' },
    { label: t('pages.notFound.booking'), href: '/retreats/check-booking' },
    { label: t('pages.notFound.mass'), href: '/mass-intentions' },
    { label: t('pages.notFound.give'), href: '/donation' },
  ]

  return (
    <main className='flex flex-1 items-center'>
      <div className='container max-w-2xl py-24 text-center'>
        <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-parchment text-gold-700'>
          <Compass className='h-8 w-8' />
        </span>
        <p className='eyebrow mt-6 justify-center'>{t('pages.notFound.eyebrow')}</p>
        <h1 className='mt-3 text-5xl sm:text-6xl'>{t('pages.notFound.title')}</h1>
        <p className='mt-4 text-lg text-muted-foreground'>{t('pages.notFound.text')}</p>
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          {suggestions.map((item) => (
            <Button key={item.href} asChild variant='outline' size='pill'>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
        <Button asChild size='pill' className='mt-6'>
          <Link href='/'>{t('common.actions.backHome')}</Link>
        </Button>
      </div>
    </main>
  )
}
