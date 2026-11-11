'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Check, Globe } from 'lucide-react'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu'
import { useLocale, useT } from '@/i18n/client'
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALE_META, LOCALES, type Locale } from '@/i18n/config'
import { localizeHref } from '@/i18n/navigation'
import { usePathnameWithoutLocale } from '@/i18n/link'
import { cn } from '@/lib/utils'

/** Remembers the choice for the proxy and for the next visit. */
export const persistLocale = (locale: Locale) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
}

const useSwitchLocale = () => {
  const router = useRouter()
  const pathname = usePathnameWithoutLocale()
  const [pending, startTransition] = useTransition()
  const switchTo = (locale: Locale) => {
    persistLocale(locale)
    // Read the query at click time (useSearchParams would opt static pages out of prerendering).
    const { search, hash } = window.location
    startTransition(() => router.replace(`${localizeHref(pathname, locale)}${search}${hash}`, { scroll: false }))
  }
  return { switchTo, pending }
}

type Variant = 'header' | 'topbar' | 'segmented'

/**
 * Language switch. `header`/`topbar` render a compact menu; `segmented`
 * renders an EN | SW toggle (used in the mobile menu and footer).
 */
export default function LanguageSwitcher({
  variant = 'header',
  tone = 'light',
  className,
}: {
  variant?: Variant
  tone?: 'light' | 'dark'
  className?: string
}) {
  const locale = useLocale()
  const t = useT()
  const { switchTo, pending } = useSwitchLocale()

  if (variant === 'segmented') {
    return (
      <div
        role='radiogroup'
        aria-label={t('common.language.label')}
        className={cn(
          'inline-flex rounded-full border p-1',
          tone === 'dark' ? 'border-white/15 bg-white/5' : 'border-border bg-white',
          pending && 'opacity-70',
          className,
        )}
      >
        {LOCALES.map((option) => (
          <button
            key={option}
            type='button'
            role='radio'
            aria-checked={option === locale}
            lang={option}
            onClick={() => option !== locale && switchTo(option)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              option === locale
                ? tone === 'dark'
                  ? 'bg-gold-400 text-navy-950'
                  : 'bg-navy-900 text-white'
                : tone === 'dark'
                  ? 'text-navy-200 hover:bg-white/10'
                  : 'text-navy-700 hover:bg-parchment',
            )}
          >
            {LOCALE_META[option].nativeName}
          </button>
        ))}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('common.language.change', { language: LOCALE_META[locale].nativeName })}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300',
          variant === 'topbar'
            ? 'px-2 py-1 text-[13px] text-gold-200 hover:text-white'
            : 'border border-navy-200 px-3 py-2 text-sm text-navy-800 hover:bg-parchment',
          pending && 'opacity-70',
          className,
        )}
      >
        <Globe className={variant === 'topbar' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
        {LOCALE_META[locale].short}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-44'>
        {LOCALES.map((option) => (
          <DropdownMenuItem key={option} lang={option} onSelect={() => option !== locale && switchTo(option)} className='flex items-center gap-3'>
            <span aria-hidden>{LOCALE_META[option].flag}</span>
            <span className='flex-1'>
              <span className='block font-medium'>{LOCALE_META[option].nativeName}</span>
              {option !== locale && <span className='block text-xs text-muted-foreground'>{LOCALE_META[option].name}</span>}
            </span>
            {option === locale && <Check className='h-4 w-4 text-gold-600' aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
