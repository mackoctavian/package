import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  businessSettingsFormSchema,
  businessSettingsResponseSchema,
  type BusinessSettingsFormValues,
  type BusinessSettingsResponse,
} from '@dashboard/features/settings/business/schema'

const businessSettingsQueryKey = ['settings', 'business'] as const

async function fetchBusinessSettings(): Promise<BusinessSettingsResponse> {
  const response = await fetch('/api/dashboard/settings/business', {
    credentials: 'include',
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to load business settings')
  }

  const payload = (await response.json()) as unknown
  return businessSettingsResponseSchema.parse(payload)
}

async function updateBusinessSettings(input: BusinessSettingsFormValues): Promise<BusinessSettingsResponse> {
  const payload = businessSettingsFormSchema.parse(input)

  const response = await fetch('/api/dashboard/settings/business', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to update business settings')
  }

  const json = (await response.json()) as unknown
  return businessSettingsResponseSchema.parse(json)
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: businessSettingsQueryKey,
    queryFn: fetchBusinessSettings,
  })
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateBusinessSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(businessSettingsQueryKey, data)
    },
  })
}

