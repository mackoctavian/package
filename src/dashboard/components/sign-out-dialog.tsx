"use client"

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ConfirmDialog } from '@dashboard/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const handleSignOut = useCallback(async () => {
    await fetch('/api/admin/session', { method: 'DELETE' })
    router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`)
  }, [router, pathname])

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}

