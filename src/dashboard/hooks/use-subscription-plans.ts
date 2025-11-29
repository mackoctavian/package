"use client"

import { useQuery } from '@tanstack/react-query'

export type LocationSubscription = {
  id: string
  name: string
  nickname: string
  businessName: string
  planName: string
  status: string
  displayStatus: string
  isDefault: boolean
  expiresAt: string | null
  gracePeriodEndsAt: string | null
  trialEndsAt: string | null
  subscriptionId: string | null
  isTrial: boolean
  isLocked: boolean
  daysRemaining: number
  durationMonths: number | null
  amount: number | null
}

export type SubscriptionResponse = {
  locations: LocationSubscription[]
}

async function fetchSubscriptionPlans(): Promise<SubscriptionResponse> {
  const response = await fetch('/api/dashboard/settings/subscription', {
    cache: 'no-store',
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error ?? 'Failed to load subscription information')
  }

  return response.json()
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['settings', 'subscription-plans'],
    queryFn: fetchSubscriptionPlans,
  })
}
