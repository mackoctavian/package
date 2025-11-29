"use client"

import { useQuery } from '@tanstack/react-query'

export type ExpenseReportSummary = {
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  overdueAmount: number
  expenseCount: number
  startDate: string
  endDate: string
}

export type ExpenseTrendPoint = {
  period: string
  label: string
  amount: number
}

export type ExpenseCategoryBreakdown = {
  category: string
  amount: number
}

export type ExpenseItem = {
  id: string
  category: string
  amount: number
  paidAmount: number
  status: string
  dueDate: string | null
  createdAt: string | null
  billId: string | null
}

export type ExpensePayment = {
  id: string
  expenseId: string
  amount: number
  paymentMethod: string
  paymentDate: string | null
}

export type ExpenseReportResponse = {
  summary: ExpenseReportSummary
  trend: ExpenseTrendPoint[]
  categories: ExpenseCategoryBreakdown[]
  expenses: ExpenseItem[]
  payments: ExpensePayment[]
}

export type UseExpenseReportParams = {
  locationIds?: string[] | null
  startDate?: string
  endDate?: string
}

async function fetchExpenseReport(params: UseExpenseReportParams = {}) {
  const search = new URLSearchParams()
  if (params.locationIds && params.locationIds.length > 0) {
    params.locationIds.forEach((id) => {
      if (id) search.append('locationId', id)
    })
  }
  if (params.startDate) {
    search.set('startDate', params.startDate)
  }
  if (params.endDate) {
    search.set('endDate', params.endDate)
  }

  const response = await fetch(
    `/api/dashboard/reports/expenses${search.toString() ? `?${search.toString()}` : ''}`,
    { cache: 'no-store' },
  )

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to load expenses report')
  }

  return (await response.json()) as ExpenseReportResponse
}

export function useExpenseReport(params: UseExpenseReportParams) {
  const locationKey =
    params.locationIds && params.locationIds.length > 0
      ? [...params.locationIds].sort()
      : null

  return useQuery({
    queryKey: ['expense-report', locationKey, params.startDate ?? null, params.endDate ?? null],
    queryFn: () => fetchExpenseReport(params),
  })
}

