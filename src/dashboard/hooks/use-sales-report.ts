"use client"

import { useQuery } from '@tanstack/react-query'

export type SalesReportSummary = {
  grossSales: number
  netSales: number
  discounts: number
  transactions: number
  averageOrderValue: number
  startDate: string
  endDate: string
}

export type SalesReportTrend = {
  period: string
  label: string
  grossSales: number
  discounts: number
  netSales: number
}

export type SalesReportItem = {
  id: string
  name: string
  grossSales: number
  quantity: number
}

export type SalesReportTeam = {
  id: string
  name: string
  saleAmount: number
  commissionAmount: number
}

export type SalesReportResponse = {
  summary: SalesReportSummary
  trend: SalesReportTrend[]
  topItems: SalesReportItem[]
  categories: Array<{ id: string; name: string; grossSales: number }>
  departments: Array<{ id: string; name: string; grossSales: number }>
  team: SalesReportTeam[]
}

export type UseSalesReportParams = {
  locationId?: string | null
  startDate?: string
  endDate?: string
}

async function fetchSalesReport(params: UseSalesReportParams = {}) {
  const search = new URLSearchParams()
  if (params.locationId) {
    search.set('locationId', params.locationId)
  }
  if (params.startDate) {
    search.set('startDate', params.startDate)
  }
  if (params.endDate) {
    search.set('endDate', params.endDate)
  }

  const response = await fetch(
    `/api/dashboard/reports/sales${search.toString() ? `?${search.toString()}` : ''}`,
    { cache: 'no-store' },
  )

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to load sales report')
  }

  return (await response.json()) as SalesReportResponse
}

export function useSalesReport(params: UseSalesReportParams) {
  return useQuery({
    queryKey: ['sales-report', params.locationId ?? null, params.startDate ?? null, params.endDate ?? null],
    queryFn: () => fetchSalesReport(params),
  })
}

