'use client'

import { createContext, useContext, useMemo } from 'react'

import { DEFAULT_LOCALE, type Locale } from './config'
import type { AppMessageKey } from './messages'
import { createTranslator, type Translator } from './translate'

type I18nContextValue = { locale: Locale; t: Translator<AppMessageKey> }

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Record<string, string>; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: createTranslator<AppMessageKey>(locale, messages) }), [locale, messages])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    // Rendered outside a provider (should not happen on public pages): fail soft with keys.
    return { locale: DEFAULT_LOCALE, t: createTranslator<AppMessageKey>(DEFAULT_LOCALE, {}) }
  }
  return context
}

/** Translator for client components. */
export const useT = () => useI18n().t
export const useLocale = () => useI18n().locale
