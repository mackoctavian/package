"use client"

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar'

const COMPLETE_DELAY_MS = 350

export function NavigationProgress() {
  const ref = useRef<LoadingBarRef>(null)
  const pathname = usePathname()
  const previousPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (previousPathRef.current === null) {
      previousPathRef.current = pathname
      return
    }

    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname
      ref.current?.continuousStart()
      const timeout = setTimeout(() => {
        ref.current?.complete()
      }, COMPLETE_DELAY_MS)

      return () => clearTimeout(timeout)
    }
  }, [pathname])

  return (
    <LoadingBar
      color='var(--muted-foreground)'
      ref={ref}
      shadow
      height={2}
    />
  )
}

