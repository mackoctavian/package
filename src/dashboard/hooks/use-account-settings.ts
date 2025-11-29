import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  accountSettingsResponseSchema,
  accountSettingsUpdateSchema,
  type AccountSettingsResponse,
  type AccountSettingsUpdateValues,
} from '@dashboard/features/settings/account/schema'

const accountSettingsQueryKey = ['settings', 'account'] as const

async function fetchAccountSettings(): Promise<AccountSettingsResponse> {
  const response = await fetch('/api/dashboard/settings/account', {
    credentials: 'include',
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to load account settings')
  }

  const payload = (await response.json()) as unknown
  return accountSettingsResponseSchema.parse(payload)
}

async function updateAccountSettings(input: AccountSettingsUpdateValues): Promise<AccountSettingsResponse> {
  const payload = accountSettingsUpdateSchema.parse(input)

  const body: Record<string, unknown> = {}

  if (payload.firstName !== undefined) {
    body.firstName = payload.firstName
  }
  if (payload.lastName !== undefined) {
    body.lastName = payload.lastName
  }
  if (payload.email !== undefined) {
    body.email = payload.email
  }
  if (payload.phone !== undefined) {
    const trimmed = payload.phone.trim()
    body.phone = trimmed === '' ? null : trimmed
  }
  if (payload.passcode !== undefined) {
    body.passcode = payload.passcode
  }
  if (payload.pin !== undefined) {
    body.pin = payload.pin
  }

  const response = await fetch('/api/dashboard/settings/account', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to update account settings')
  }

  const json = (await response.json()) as unknown
  return accountSettingsResponseSchema.parse(json)
}

export function useAccountSettings() {
  return useQuery({
    queryKey: accountSettingsQueryKey,
    queryFn: fetchAccountSettings,
  })
}

export function useUpdateAccountSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAccountSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(accountSettingsQueryKey, data)
    },
  })
}

