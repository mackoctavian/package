"use client"

import { createContext, useContext } from 'react'

import type { AdminUserPayload } from '@/lib/auth/admin-shared'

const AdminUserContext = createContext<AdminUserPayload | null>(null)

export const AdminUserProvider = ({
  value,
  children,
}: {
  value: AdminUserPayload
  children: React.ReactNode
}) => <AdminUserContext.Provider value={value}>{children}</AdminUserContext.Provider>

export const useAdminUser = () => {
  const context = useContext(AdminUserContext)
  if (!context) {
    throw new Error('useAdminUser must be used within an AdminUserProvider')
  }
  return context
}


