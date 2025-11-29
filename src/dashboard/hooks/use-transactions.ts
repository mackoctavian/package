"use client"

import { useQuery } from '@tanstack/react-query'

export type TransactionFilters = {
  startDate?: string
  endDate?: string
  locationId?: string
  paymentStatus?: string
  paymentMethod?: string
  search?: string
  source?: string
}

export type Transaction = {
  id: number
  reference: string
  amount: number
  paymentMethod: string | null
  paymentStatus: string | null
  createdAt: string
  items: string[]
  locationName: string | null
  source: string | null
}

export type TransactionsResponse = {
  transactions: Transaction[]
  total: number
  totalAmount: number
}

async function fetchTransactions(filters: TransactionFilters): Promise<TransactionsResponse> {
  const searchParams = new URLSearchParams()

  if (filters.startDate) {
    searchParams.set('startDate', filters.startDate)
  }

  if (filters.endDate) {
    searchParams.set('endDate', filters.endDate)
  }

  if (filters.locationId) {
    searchParams.set('locationId', filters.locationId)
  }

  if (filters.paymentStatus) {
    searchParams.set('status', filters.paymentStatus)
  }

  if (filters.paymentMethod) {
    searchParams.set('method', filters.paymentMethod)
  }

  if (filters.search) {
    searchParams.set('search', filters.search)
  }

  if (filters.source) {
    searchParams.set('source', filters.source)
  }

  const queryString = searchParams.toString()
  const response = await fetch(
    queryString ? `/api/dashboard/transactions?${queryString}` : '/api/dashboard/transactions',
    {
      credentials: 'include',
    }
  )

  if (!response.ok) {
    throw new Error('Failed to load transactions')
  }

  return response.json()
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['dashboard-transactions', filters],
    queryFn: () => fetchTransactions(filters),
    staleTime: 1000 * 60 * 1,
  })
}

