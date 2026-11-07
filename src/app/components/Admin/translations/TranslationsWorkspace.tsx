'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FileText, Globe, Smartphone } from 'lucide-react'

import { PageBody, PageHeader } from '@/app/components/Admin/shell/primitives'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { LOCALE_META, LOCALES, SOURCE_LOCALE, type Locale } from '@/i18n/config'
import { ContentTab } from './ContentTab'
import { InterfaceTextTab } from './InterfaceTextTab'

const TABS = ['content', 'website', 'app'] as const
type Tab = (typeof TABS)[number]

const TARGETS = LOCALES.filter((locale) => locale !== SOURCE_LOCALE)

/**
 * Admin → Translations. English is always the source; this is where the
 * Swahili (and any future language) versions are written and reviewed.
 * State lives in the URL so a link opens the same view.
 */
export function TranslationsWorkspace() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tab: Tab = (TABS as readonly string[]).includes(searchParams.get('tab') ?? '') ? (searchParams.get('tab') as Tab) : 'content'
  const requested = searchParams.get('locale')
  const locale: Locale = TARGETS.find((candidate) => candidate === requested) ?? TARGETS[0]

  const setParams = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(next)) {
        if (value === null || value === '') params.delete(key)
        else params.set(key, value)
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const target = LOCALE_META[locale]

  return (
    <PageBody>
      <PageHeader
        eyebrow='Website content'
        title='Translations'
        description={`English is the original. Write the ${target.name} version of content and interface text here; anything not yet translated shows in English.`}
        actions={
          TARGETS.length > 1 ? (
            <select
              aria-label='Language'
              value={locale}
              onChange={(event) => setParams({ locale: event.target.value, group: null, item: null })}
              className='h-10 rounded-lg border border-input bg-white px-3 text-sm'
            >
              {TARGETS.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {LOCALE_META[candidate].name}
                </option>
              ))}
            </select>
          ) : (
            <span className='inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-navy-950'>
              <span aria-hidden>{target.flag}</span>
              {LOCALE_META[SOURCE_LOCALE].name} → {target.name}
            </span>
          )
        }
      />

      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value === 'content' ? null : value, group: null, item: null, q: null, ns: null, show: null })}>
        <TabsList className='h-auto flex-wrap'>
          <TabsTrigger value='content' className='gap-2'>
            <FileText className='h-4 w-4' /> Content
          </TabsTrigger>
          <TabsTrigger value='website' className='gap-2'>
            <Globe className='h-4 w-4' /> Website text
          </TabsTrigger>
          <TabsTrigger value='app' className='gap-2'>
            <Smartphone className='h-4 w-4' /> App text
          </TabsTrigger>
        </TabsList>

        <TabsContent value='content' className='mt-6'>
          {tab === 'content' && <ContentTab locale={locale} params={searchParams} setParams={setParams} />}
        </TabsContent>
        <TabsContent value='website' className='mt-6'>
          {tab === 'website' && <InterfaceTextTab scope='web' locale={locale} params={searchParams} setParams={setParams} />}
        </TabsContent>
        <TabsContent value='app' className='mt-6'>
          {tab === 'app' && <InterfaceTextTab scope='mobile' locale={locale} params={searchParams} setParams={setParams} />}
        </TabsContent>
      </Tabs>
    </PageBody>
  )
}

export type SetParams = (next: Record<string, string | null>) => void
