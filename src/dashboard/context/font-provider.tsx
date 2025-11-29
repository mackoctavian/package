"use client"

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { fonts } from '@/config/fonts'
import { getCookie, removeCookie, setCookie } from '@dashboard/lib/cookies'

type Font = (typeof fonts)[number]

const FONT_COOKIE_NAME = 'font'
const FONT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type FontContextType = {
  font: Font
  setFont: (font: Font) => void
  resetFont: () => void
}

const FontContext = createContext<FontContextType | undefined>(undefined)

function applyFontClass(font: Font) {
  const root = document.documentElement
  root.classList.forEach((cls) => {
    if (cls.startsWith('font-')) root.classList.remove(cls)
  })
  root.classList.add(`font-${font}`)
}

export function FontProvider({ children }: { children: ReactNode }) {
  const initialFont = useMemo<Font>(() => {
    const savedFont = getCookie(FONT_COOKIE_NAME)
    return fonts.includes(savedFont as Font) ? (savedFont as Font) : fonts[0]
  }, [])

  const [font, setFontState] = useState<Font>(initialFont)

  useEffect(() => {
    applyFontClass(font)
  }, [font])

  const setFont = (nextFont: Font) => {
    setCookie(FONT_COOKIE_NAME, nextFont, FONT_COOKIE_MAX_AGE)
    setFontState(nextFont)
  }

  const resetFont = () => {
    removeCookie(FONT_COOKIE_NAME)
    setFontState(fonts[0])
  }

  const value = useMemo<FontContextType>(
    () => ({ font, setFont, resetFont }),
    [font]
  )

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>
}

export function useFont(): FontContextType {
  const context = useContext(FontContext)
  if (!context) {
    throw new Error('useFont must be used within a FontProvider')
  }
  return context
}
