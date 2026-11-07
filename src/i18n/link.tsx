'use client'

import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { forwardRef, useMemo, type ComponentProps } from 'react'

import { useLocale } from './client'
import type { Locale } from './config'
import { localizeHref, stripLocale } from './navigation'

type LinkProps = ComponentProps<typeof NextLink> & { locale?: Locale }

/** `next/link` that keeps the visitor in their language: `/retreats` becomes `/sw/retreats` for Swahili. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function LocalizedLink({ href, locale, ...props }, ref) {
  const current = useLocale()
  const target = locale ?? current
  const localized =
    typeof href === 'string'
      ? localizeHref(href, target)
      : { ...href, pathname: href.pathname ? localizeHref(href.pathname, target) : href.pathname }
  return <NextLink ref={ref} href={localized} {...props} />
})

/** `useRouter` whose push/replace/prefetch add the current language prefix. */
export const useLocalizedRouter = () => {
  const router = useRouter()
  const locale = useLocale()
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) => router.push(localizeHref(href, locale), options),
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) => router.replace(localizeHref(href, locale), options),
      prefetch: (href: string) => router.prefetch(localizeHref(href, locale)),
    }),
    [router, locale],
  )
}

/** The current path without its language prefix, e.g. `/retreats` on both `/retreats` and `/sw/retreats`. */
export const usePathnameWithoutLocale = () => stripLocale(usePathname() ?? '/')
