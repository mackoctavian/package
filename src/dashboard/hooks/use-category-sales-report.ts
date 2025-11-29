"use client"

import { useQuery } from '@tanstack/react-query'

export type CategorySalesSummary = {
  totalGrossSales: number
  totalNetSales: number
  totalDiscounts: number
  totalQuantity: number
  categoryCount: number
  startDate: string
  endDate: string
}

export type CategorySalesRow = {
  id: string
  name: string
  grossSales: number
  netSales: number
  discounts: number
  quantity: number
}

export type CategorySalesChartSeries = {
  id: string
  name: string
}

export type CategorySalesChartPoint = {
  label: string
  bucket: string
  [seriesId: string]: string | number
}

export type CategorySalesReportResponse = {
  summary: CategorySalesSummary
  chart: {
    series: CategorySalesChartSeries[]
    data: CategorySalesChartPoint[]
  }
  categories: CategorySalesRow[]
}

export type UseCategorySalesReportParams = {
  locationIds?: string[] | null
  startDate?: string
  endDate?: string
}

async function fetchCategorySalesReport(params: UseCategorySalesReportParams = {}) {
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
    `/api/dashboard/reports/category-sales${search.toString() ? `?${search.toString()}` : ''}`,
    { cache: 'no-store' },
  )

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to load category sales report')
  }

  return (await response.json()) as CategorySalesReportResponse
}

export function useCategorySalesReport(params: UseCategorySalesReportParams) {
  const locationKey =
    params.locationIds && params.locationIds.length > 0
      ? [...params.locationIds].sort()
      : null

  return useQuery({
    queryKey: ['category-sales-report', locationKey, params.startDate ?? null, params.endDate ?? null],
    queryFn: () => fetchCategorySalesReport(params),
  })
}


