"use client"

import { useQuery } from '@tanstack/react-query'

export type SidebarLocation = {
  id: string
  name: string
  nickname: string
  businessName: string
  city: string | null
  country: string | null
  isDefault: boolean
  isActive: boolean
}

export type SidebarProfile = {
  id: string
  username: string | null
  businessName: string | null
  email: string | null
  avatarUrl: string | null
  countryId: string | null
}

export type SidebarInfoResponse = {
  profile: SidebarProfile
  locations: SidebarLocation[]
}

export const SIDEBAR_INFO_QUERY_KEY = ['sidebar-info'] as const

async function fetchSidebarInfo(): Promise<SidebarInfoResponse> {
  const response = await fetch('/api/dashboard/sidebar-info', {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to load sidebar info')
  }

  return response.json()
}

export function useSidebarInfo() {
  return useQuery({
    queryKey: SIDEBAR_INFO_QUERY_KEY,
    queryFn: fetchSidebarInfo,
    staleTime: 1000 * 60 * 5,
  })
}
