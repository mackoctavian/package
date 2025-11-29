"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createInventoryItemSchema,
  type CreateInventoryItemInput,
  type UpdateInventoryItemInput,
} from '@dashboard/features/inventory/items/schema'

export type InventoryItem = {
  id: string
  name: string
  description: string | null
  stockKeepingUnit: string | null
  barcode: string | null
  tileColor: string | null
  price: number
  stockQuantity: number
  isActive: boolean
  trackStock: boolean
  category: { id: string; name: string } | null
  department: { id: string; name: string } | null
  location: { id: string; name: string; nickname: string | null } | null
  createdAt: string | null
  updatedAt: string | null
}

export type InventoryItemsPagination = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type InventoryItemsResponse = {
  data: InventoryItem[]
  pagination: InventoryItemsPagination
}

export type InventoryItemsQuery = {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  categoryId?: string
  departmentId?: string
  locationId?: string
  page?: number
  pageSize?: number
}

async function fetchInventoryItems(params: InventoryItemsQuery = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  const response = await fetch(
    queryString
      ? `/api/dashboard/inventory/items?${queryString}`
      : '/api/dashboard/inventory/items',
    {
      credentials: 'include',
    }
  )

  if (!response.ok) {
    throw new Error('Failed to load items')
  }

  return (await response.json()) as InventoryItemsResponse
}

async function createInventoryItem(input: CreateInventoryItemInput) {
  const payload = createInventoryItemSchema.parse(input)

  const response = await fetch('/api/dashboard/inventory/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to create item')
  }

  return (await response.json()) as InventoryItem
}

async function updateInventoryItem(id: string, input: UpdateInventoryItemInput) {
  const response = await fetch(`/api/dashboard/inventory/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to update item')
  }

  return (await response.json()) as InventoryItem
}

async function deleteInventoryItem(id: string) {
  const response = await fetch(`/api/dashboard/inventory/items/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to delete item')
  }

  return true
}

export function useInventoryItems(query: InventoryItemsQuery) {
  return useQuery({
    queryKey: ['inventory-items', query],
    queryFn: () => fetchInventoryItems(query),
  })
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    },
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInventoryItemInput }) =>
      updateInventoryItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    },
  })
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    },
  })
}

