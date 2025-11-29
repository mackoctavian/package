"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createInventoryCategorySchema,
  type CreateInventoryCategoryInput,
  type UpdateInventoryCategoryInput,
} from '@dashboard/features/inventory/categories/schema'

export type InventoryCategory = {
  id: string
  name: string
  description: string | null
  tileColor: string | null
  tileLabel: string | null
  iconName: string | null
  imageUrl: string | null
  isActive: boolean
  parent: { id: string; name: string } | null
  department: { id: string; name: string } | null
  location: { id: string; name: string; nickname: string | null } | null
  createdAt: string | null
  updatedAt: string | null
}

export type InventoryCategoriesPagination = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type InventoryCategoriesResponse = {
  data: InventoryCategory[]
  pagination: InventoryCategoriesPagination
}

export type InventoryCategoriesQuery = {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  departmentId?: string
  parentId?: string
  locationId?: string
  page?: number
  pageSize?: number
}

async function fetchInventoryCategories(params: InventoryCategoriesQuery = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  const response = await fetch(
    queryString
      ? `/api/dashboard/inventory/categories?${queryString}`
      : '/api/dashboard/inventory/categories',
    { credentials: 'include' }
  )

  if (!response.ok) {
    throw new Error('Failed to load categories')
  }

  return (await response.json()) as InventoryCategoriesResponse
}

async function createInventoryCategory(input: CreateInventoryCategoryInput) {
  const payload = createInventoryCategorySchema.parse(input)

  const response = await fetch('/api/dashboard/inventory/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to create category')
  }

  return (await response.json()) as InventoryCategory
}

async function updateInventoryCategory(
  id: string,
  input: UpdateInventoryCategoryInput
) {
  const response = await fetch(`/api/dashboard/inventory/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to update category')
  }

  return (await response.json()) as InventoryCategory
}

async function deleteInventoryCategory(id: string) {
  const response = await fetch(`/api/dashboard/inventory/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to delete category')
  }

  return true
}

export function useInventoryCategories(query: InventoryCategoriesQuery) {
  return useQuery<InventoryCategoriesResponse>({
    queryKey: ['inventory-categories', query],
    queryFn: () => fetchInventoryCategories(query),
  })
}

export function useCreateInventoryCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInventoryCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
    },
  })
}

export function useUpdateInventoryCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInventoryCategoryInput }) =>
      updateInventoryCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    },
  })
}

export function useDeleteInventoryCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteInventoryCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    },
  })
}

