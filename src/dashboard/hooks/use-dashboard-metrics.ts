"use client"

import { useQuery } from '@tanstack/react-query'

export type DashboardMonthlySales = {
  month: number
  label: string
  grossSales: number
  discounts: number
  netSales: number
}

export type DashboardRecentSale = {
  id: number
  amount: number
  createdAt: string
  items: Array<{
    name: string
    quantity: number | null
    totalPrice: number | null
  }>
}

export type DashboardPerformanceSnapshot = {
  netSales: number
  grossSales: number
  discounts: number
  transactions: number
  averageSale: number
  startDate: string
  endDate: string
}

export type DashboardPerformanceSeriesPoint = {
  label: string
  currentValue: number
  previousValue: number
  currentDate: string
  previousDate: string
}

export type DashboardPerformanceLocation = {
  id: string
  name: string
  nickname: string
  isDefault: boolean
  netSales: number
  previousNetSales: number
  transactions: number
  previousTransactions: number
}

export type DashboardPerformance = {
  interval: 'day' | 'month'
  series: DashboardPerformanceSeriesPoint[]
  locations: DashboardPerformanceLocation[]
  current: DashboardPerformanceSnapshot
  comparison: DashboardPerformanceSnapshot
  comparisonOffset: number
}

export type DashboardMetrics = {
  netSales: number
  grossSales: number
  discounts: number
  transactions: number
  startDate: string
  endDate: string
  locationIds: string[]
  monthlySales: DashboardMonthlySales[]
  recentSales: DashboardRecentSale[]
  performance: DashboardPerformance
}

type DashboardMetricsParams = {
  locationIds?: string[] | null
  startDate: string
  endDate: string
  comparisonOffset?: number
}

async function fetchDashboardMetrics(params: DashboardMetricsParams) {
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
  if (params.comparisonOffset && Number.isFinite(params.comparisonOffset)) {
    search.set('comparisonOffset', String(params.comparisonOffset))
  }

  const queryString = search.toString()
  const url = queryString ? `/api/dashboard/metrics?${queryString}` : '/api/dashboard/metrics'

  const response = await fetch(url, { credentials: 'include' })

  if (!response.ok) {
    throw new Error('Failed to load metrics')
  }

  return (await response.json()) as DashboardMetrics
}

export function useDashboardMetrics(params: DashboardMetricsParams) {
  const locationKey =
    params.locationIds && params.locationIds.length > 0
      ? [...params.locationIds].sort()
      : null

  return useQuery({
    queryKey: ['dashboard-metrics', locationKey, params.startDate, params.endDate, params.comparisonOffset ?? 1],
    queryFn: () => fetchDashboardMetrics(params),
    enabled: Boolean(params.startDate && params.endDate),
    staleTime: 1000 * 60 * 5,
  })
}

