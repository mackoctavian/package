"use client"

import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, 'Current password must be at least 6 characters.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.')
      .max(72, 'New password must not exceed 72 characters.'),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'New password must be different from the current password.',
    path: ['newPassword'],
  })

export type UpdateAccountPasswordInput = z.infer<typeof updatePasswordSchema>

async function updateAccountPassword(input: UpdateAccountPasswordInput): Promise<void> {
  const payload = updatePasswordSchema.parse(input)

  const response = await fetch('/api/dashboard/settings/account/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to update password')
  }
}

export function useUpdateAccountPassword() {
  return useMutation({
    mutationFn: updateAccountPassword,
  })
}



