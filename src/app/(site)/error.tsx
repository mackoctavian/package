'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/app/components/ui/button'

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className='container max-w-2xl py-24 text-center'>
      <p className='eyebrow justify-center'>Something went wrong</p>
      <h1 className='mt-3 text-5xl'>We could not load this page</h1>
      <p className='mt-4 text-lg text-muted-foreground'>Please try again. If the problem continues, contact the DMRC office.</p>
      <div className='mt-8 flex flex-wrap justify-center gap-3'>
        <Button size='pill' onClick={reset}>
          <RefreshCw className='mr-2 h-4 w-4' /> Try again
        </Button>
        <Button asChild variant='outline' size='pill'>
          <Link href='/'>Back to home</Link>
        </Button>
      </div>
    </main>
  )
}
