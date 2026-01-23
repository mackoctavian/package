'use client'

import { useEffect, useState } from 'react'

type BrandingSettings = {
  primaryLogoUrl: string
  inverseLogoUrl?: string | null
  logoAlt?: string | null
}

const DEFAULT_BRANDING: BrandingSettings = {
  primaryLogoUrl: '/images/logo/dmrc.svg',
  inverseLogoUrl: '',
  logoAlt: 'DMRC logo',
}

let cachedBranding: BrandingSettings | null = null

export function useBranding() {
  const [branding, setBranding] = useState<BrandingSettings>(cachedBranding ?? DEFAULT_BRANDING)
  const [isLoading, setIsLoading] = useState(!cachedBranding)

  useEffect(() => {
    let isMounted = true

    const fetchBranding = async () => {
      try {
        const response = await fetch('/api/site-settings/branding')
        if (!response.ok) throw new Error('Failed to load branding')
        const payload = await response.json()
        const merged = { ...DEFAULT_BRANDING, ...(payload.data ?? {}) }
        cachedBranding = merged
        if (!isMounted) return
        setBranding(merged)
      } catch (error) {
        console.error('[useBranding]', error)
        if (isMounted) {
          setBranding(DEFAULT_BRANDING)
          cachedBranding = DEFAULT_BRANDING
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (cachedBranding) {
      setBranding(cachedBranding)
      setIsLoading(false)
    } else {
      fetchBranding()
    }

    const handleRefresh = () => {
      cachedBranding = null
      setIsLoading(true)
      fetchBranding()
    }

    window.addEventListener('branding-updated', handleRefresh)

    return () => {
      window.removeEventListener('branding-updated', handleRefresh)
      isMounted = false
    }
  }, [])

  return {
    logoUrl: branding.primaryLogoUrl,
    inverseLogoUrl: branding.inverseLogoUrl || branding.primaryLogoUrl,
    logoAlt: branding.logoAlt ?? 'Site logo',
    isLoading,
  }
}

