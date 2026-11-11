import type { Metadata } from 'next'

import NotFoundContent from '@/app/components/site/NotFoundContent'
import SiteFooter from '@/app/components/site/SiteFooter'
import SiteHeader from '@/app/components/site/SiteHeader'
import { I18nProvider } from '@/i18n/client'
import { DEFAULT_LOCALE } from '@/i18n/config'
import { getMessages, setRequestLocale } from '@/i18n/server'

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } }

/** 404 for paths outside the language-prefixed site (e.g. a mistyped /admin link). */
export default async function NotFoundPage() {
  setRequestLocale(DEFAULT_LOCALE)
  const messages = await getMessages(DEFAULT_LOCALE)
  return (
    <I18nProvider locale={DEFAULT_LOCALE} messages={messages}>
      <div className='flex min-h-screen flex-col bg-ivory text-navy-900'>
        <SiteHeader />
        <div id='main-content' className='flex flex-1'>
          <NotFoundContent />
        </div>
        <SiteFooter />
      </div>
    </I18nProvider>
  )
}
