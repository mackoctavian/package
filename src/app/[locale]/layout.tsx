import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import SiteHeader from '@/app/components/site/SiteHeader'
import SiteFooter from '@/app/components/site/SiteFooter'
import ScrollToTop from '@/app/components/ScrollToTop'
import Aoscompo from '@/utils/aos'
import { siteConfig } from '@/app/data/site'
import { I18nProvider } from '@/i18n/client'
import { LOCALE_META, LOCALES, isLocale } from '@/i18n/config'
import { getMessages, getT, setRequestLocale } from '@/i18n/server'

export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }))
export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const t = await getT(locale)
  return {
    title: {
      default: `${siteConfig.name} | ${siteConfig.shortName}`,
      template: `%s | ${siteConfig.shortName}`,
    },
    description: t('meta.siteDescription'),
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      title: siteConfig.name,
      description: t('meta.siteDescription'),
      locale: LOCALE_META[locale].ogLocale,
      alternateLocale: LOCALES.filter((item) => item !== locale).map((item) => LOCALE_META[item].ogLocale),
    },
  }
}

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  setRequestLocale(locale)
  const messages = await getMessages(locale)

  return (
    <I18nProvider locale={locale} messages={messages}>
      <Aoscompo>
        <div className='relative flex min-h-screen flex-col bg-ivory text-navy-900'>
          <SiteHeader />
          <div id='main-content' className='flex-1'>
            {children}
          </div>
          <SiteFooter />
          <ScrollToTop />
        </div>
      </Aoscompo>
    </I18nProvider>
  )
}
