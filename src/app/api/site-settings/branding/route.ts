import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { guardAdminApi } from '@/lib/auth/api-guard'

const SETTINGS_KEY = 'branding'

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

export async function GET() {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { key: SETTINGS_KEY },
    })

    const payload = {
      ...DEFAULT_BRANDING,
      ...((record?.value as BrandingSettings) ?? {}),
    }

    return NextResponse.json({ data: payload })
  } catch (error) {
    console.error('[site-settings][branding][GET]', error)
    return NextResponse.json({ error: 'Failed to load branding settings' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const denied = await guardAdminApi('homepage')
  if (denied) return denied

  try {
    const body = (await request.json()) as Partial<BrandingSettings>

    if (!body.primaryLogoUrl || typeof body.primaryLogoUrl !== 'string') {
      return NextResponse.json({ error: 'primaryLogoUrl is required' }, { status: 400 })
    }

    const value: BrandingSettings = {
      primaryLogoUrl: body.primaryLogoUrl,
      inverseLogoUrl: body.inverseLogoUrl ?? '',
      logoAlt: body.logoAlt ?? 'Site logo',
    }

    const record = await prisma.siteSettings.upsert({
      where: { key: SETTINGS_KEY },
      update: { value },
      create: { key: SETTINGS_KEY, value },
    })

    return NextResponse.json({ data: record.value })
  } catch (error) {
    console.error('[site-settings][branding][PATCH]', error)
    return NextResponse.json({ error: 'Failed to update branding settings' }, { status: 500 })
  }
}

