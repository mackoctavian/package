'use client'

import { useParams } from 'next/navigation'

import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'

/**
 * Renders `<html>` with the right `lang` for the page being shown. The root
 * layout sits above the `[locale]` segment, so it reads the route params here.
 */
export default function LocaleHtml({ className, children }: { className?: string; children: React.ReactNode }) {
  const params = useParams<{ locale?: string }>()
  const locale = isLocale(params?.locale) ? params.locale : DEFAULT_LOCALE
  return (
    <html lang={locale} suppressHydrationWarning className={className}>
      {children}
    </html>
  )
}
