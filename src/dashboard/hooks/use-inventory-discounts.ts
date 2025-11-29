"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createInventoryDiscountSchema,
  type CreateInventoryDiscountInput,
  type UpdateInventoryDiscountInput,
} from '@dashboard/features/inventory/discounts/schema'

export type InventoryDiscount = {
  id: string
  name: string
  type: string
  amount: number | null
  applyAfterTax: boolean
  requiresPasscode: boolean
  isActive: boolean
  location: { id: string; name: string; nickname: string | null } | null
  createdAt: string
  updatedAt: string
}

export type InventoryDiscountsPagination = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type InventoryDiscountsResponse = {
  data: InventoryDiscount[]
  pagination: InventoryDiscountsPagination
}

export type InventoryDiscountsQuery = {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  type?: string
  locationId?: string
  page?: number
  pageSize?: number
}

async function fetchInventoryDiscounts(params: InventoryDiscountsQuery = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  const response = await fetch(
    queryString
      ? `/api/dashboard/inventory/discounts?${queryString}`
      : '/api/dashboard/inventory/discounts',
    { credentials: 'include' }
  )

  if (!response.ok) {
    throw new Error('Failed to load discounts')
  }

  return (await response.json()) as InventoryDiscountsResponse
}

async function createInventoryDiscount(input: CreateInventoryDiscountInput) {
  const payload = createInventoryDiscountSchema.parse(input)

  const response = await fetch('/api/dashboard/inventory/discounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to create discount')
  }

  return (await response.json()) as InventoryDiscount
}

async function updateInventoryDiscount(
  id: string,
  input: UpdateInventoryDiscountInput
) {
  const response = await fetch(`/api/dashboard/inventory/discounts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to update discount')
  }

  return (await response.json()) as InventoryDiscount
}

async function deleteInventoryDiscount(id: string) {
  const response = await fetch(`/api/dashboard/inventory/discounts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to delete discount')
  }

  return true
}

export function useInventoryDiscounts(query: InventoryDiscountsQuery) {
  return useQuery({
    queryKey: ['inventory-discounts', query],
    queryFn: () => fetchInventoryDiscounts(query),
  })
}

export function useCreateInventoryDiscount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInventoryDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-discounts'] })
    },
  })
}

export function useUpdateInventoryDiscount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInventoryDiscountInput }) =>
      updateInventoryDiscount(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-discounts'] })
    },
  })
}

export function useDeleteInventoryDiscount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteInventoryDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-discounts'] })
    },
  })
}

