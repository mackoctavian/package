"use client"

import { useQuery } from '@tanstack/react-query'

export type DepartmentSalesSummary = {
  totalGrossSales: number
  totalNetSales: number
  totalDiscounts: number
  totalQuantity: number
  departmentCount: number
  startDate: string
  endDate: string
}

export type DepartmentSalesRow = {
  id: string
  name: string
  grossSales: number
  netSales: number
  discounts: number
  quantity: number
}

export type DepartmentSalesChartSeries = {
  id: string
  name: string
}

export type DepartmentSalesChartPoint = {
  label: string
  bucket: string
  [seriesId: string]: string | number
}

export type DepartmentSalesReportResponse = {
  summary: DepartmentSalesSummary
  chart: {
    series: DepartmentSalesChartSeries[]
    data: DepartmentSalesChartPoint[]
  }
  departments: DepartmentSalesRow[]
}

export type UseDepartmentSalesReportParams = {
  locationIds?: string[] | null
  startDate?: string
  endDate?: string
}

async function fetchDepartmentSalesReport(params: UseDepartmentSalesReportParams = {}) {
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
    `/api/dashboard/reports/department-sales${search.toString() ? `?${search.toString()}` : ''}`,
    { cache: 'no-store' },
  )

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to load department sales report')
  }

  return (await response.json()) as DepartmentSalesReportResponse
}

export function useDepartmentSalesReport(params: UseDepartmentSalesReportParams) {
  const locationKey =
    params.locationIds && params.locationIds.length > 0
      ? [...params.locationIds].sort()
      : null

  return useQuery({
    queryKey: ['department-sales-report', locationKey, params.startDate ?? null, params.endDate ?? null],
    queryFn: () => fetchDepartmentSalesReport(params),
  })
}


