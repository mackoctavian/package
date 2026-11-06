import { NextResponse } from 'next/server'
import { guardAdminApi } from '@/lib/auth/api-guard'

export const GET = async () => {
  const denied = await guardAdminApi()
  if (denied) return denied

  return NextResponse.json({
    profile: {
      id: 'admin',
      username: 'DMRC Admin',
      businessName: 'Divine Mercy Retreat Center',
      email: 'admin@dmrc.org',
      avatarUrl: null,
      countryId: 'uk',
    },
    locations: [
      {
        id: 'palakkad',
        name: 'Palakkad Base',
        nickname: 'Base',
        businessName: 'DMRC Palakkad',
        city: 'Palakkad',
        country: 'India',
        isDefault: true,
        isActive: true,
      },
    ],
  })
}

