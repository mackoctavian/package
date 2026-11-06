import type { Metadata } from 'next'
import Link from 'next/link'
import { Compass } from 'lucide-react'

import SiteFooter from '@/app/components/site/SiteFooter'
import SiteHeader from '@/app/components/site/SiteHeader'
import { Button } from '@/app/components/ui/button'

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } }

const suggestions = [
  { label: 'Upcoming retreats', href: '/retreats' },
  { label: 'Manage my booking', href: '/retreats/check-booking' },
  { label: 'Request a Mass intention', href: '/mass-intentions' },
  { label: 'Give online', href: '/donation' },
]

export default function NotFoundPage() {
  return (
    <div className='flex min-h-screen flex-col bg-ivory text-navy-900'>
      <SiteHeader />
      <main id='main-content' className='flex flex-1 items-center'>
        <div className='container max-w-2xl py-24 text-center'>
          <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-parchment text-gold-700'>
            <Compass className='h-8 w-8' />
          </span>
          <p className='eyebrow mt-6 justify-center'>Error 404</p>
          <h1 className='mt-3 text-5xl sm:text-6xl'>This page could not be found</h1>
          <p className='mt-4 text-lg text-muted-foreground'>The link may be out of date, or the page may have moved. These might help you find your way.</p>
          <div className='mt-8 flex flex-wrap justify-center gap-3'>
            {suggestions.map((item) => (
              <Button key={item.href} asChild variant='outline' size='pill'>
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
          <Button asChild size='pill' className='mt-6'>
            <Link href='/'>Back to home</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
