"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createInventoryDepartmentSchema,
  type CreateInventoryDepartmentInput,
  type UpdateInventoryDepartmentInput,
} from '@dashboard/features/inventory/departments/schema'

export type InventoryDepartment = {
  id: string
  name: string
  description: string | null
  tileColor: string | null
  isActive: boolean
  location: { id: string; name: string; nickname: string | null } | null
  createdAt: string | null
  updatedAt: string | null
}

export type InventoryDepartmentsPagination = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type InventoryDepartmentsResponse = {
  data: InventoryDepartment[]
  pagination: InventoryDepartmentsPagination
}

export type InventoryDepartmentsQuery = {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  locationId?: string
  page?: number
  pageSize?: number
}

async function fetchInventoryDepartments(
  params: InventoryDepartmentsQuery = {}
) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  const response = await fetch(
    queryString
      ? `/api/dashboard/inventory/departments?${queryString}`
      : '/api/dashboard/inventory/departments',
    { credentials: 'include' }
  )

  if (!response.ok) {
    throw new Error('Failed to load departments')
  }

  return (await response.json()) as InventoryDepartmentsResponse
}

async function createInventoryDepartment(input: CreateInventoryDepartmentInput) {
  const payload = createInventoryDepartmentSchema.parse(input)

  const response = await fetch('/api/dashboard/inventory/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to create department')
  }

  return (await response.json()) as InventoryDepartment
}

async function updateInventoryDepartment(
  id: string,
  input: UpdateInventoryDepartmentInput
) {
  const response = await fetch(`/api/dashboard/inventory/departments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to update department')
  }

  return (await response.json()) as InventoryDepartment
}

async function deleteInventoryDepartment(id: string) {
  const response = await fetch(`/api/dashboard/inventory/departments/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to delete department')
  }

  return true
}

export function useInventoryDepartments(query: InventoryDepartmentsQuery) {
  return useQuery<InventoryDepartmentsResponse>({
    queryKey: ['inventory-departments', query],
    queryFn: () => fetchInventoryDepartments(query),
  })
}

export function useCreateInventoryDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInventoryDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-departments'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    },
  })
}

export function useUpdateInventoryDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInventoryDepartmentInput }) =>
      updateInventoryDepartment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-departments'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    },
  })
}

export function useDeleteInventoryDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteInventoryDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-departments'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    },
  })
}

