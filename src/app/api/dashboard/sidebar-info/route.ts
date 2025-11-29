import { NextResponse } from 'next/server'

export const GET = async () => {
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

