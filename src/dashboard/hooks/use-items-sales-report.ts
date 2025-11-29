"use client"

import { useQuery } from '@tanstack/react-query'

export type ItemSalesSummary = {
  totalGrossSales: number
  totalNetSales: number
  totalDiscounts: number
  totalQuantity: number
  uniqueItems: number
  startDate: string
  endDate: string
}

export type ItemSalesTableRow = {
  id: string
  name: string
  category: string
  grossSales: number
  netSales: number
  discounts: number
  quantity: number
}

export type ItemSalesChartSeries = {
  id: string
  name: string
}

export type ItemSalesChartPoint = {
  label: string
  bucket: string
  [seriesId: string]: string | number
}

export type ItemSalesReportResponse = {
  summary: ItemSalesSummary
  chart: {
    series: ItemSalesChartSeries[]
    data: ItemSalesChartPoint[]
  }
  topItems: ItemSalesTableRow[]
  items: ItemSalesTableRow[]
}

export type UseItemSalesReportParams =
  | {
      locationIds?: string[] | null
      startDate?: string
      endDate?: string
    }
  | {
      locationId?: string | null
      startDate?: string
      endDate?: string
    }

async function fetchItemSalesReport(params: UseItemSalesReportParams = {}) {
  const search = new URLSearchParams()
  const locationIds =
    'locationIds' in params
      ? params.locationIds
      : 'locationId' in params && params.locationId
        ? [params.locationId]
        : undefined

  if (locationIds && locationIds.length > 0) {
    locationIds.forEach((id) => {
      if (id) {
        search.append('locationId', id)
      }
    })
  }

  if (params.startDate) {
    search.set('startDate', params.startDate)
  }
  if (params.endDate) {
    search.set('endDate', params.endDate)
  }

  const response = await fetch(
    `/api/dashboard/reports/items-sales${search.toString() ? `?${search.toString()}` : ''}`,
    { cache: 'no-store' },
  )

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to load item sales report')
  }

  return (await response.json()) as ItemSalesReportResponse
}

export function useItemSalesReport(params: UseItemSalesReportParams) {
  const locationIds =
    'locationIds' in params
      ? params.locationIds ?? null
      : 'locationId' in params
        ? params.locationId
          ? [params.locationId]
          : null
        : null
  const normalizedLocationKey =
    Array.isArray(locationIds) && locationIds.length > 0
      ? [...locationIds].sort()
      : null

  return useQuery({
    queryKey: [
      'items-sales-report',
      normalizedLocationKey,
      params.startDate ?? null,
      params.endDate ?? null,
    ],
    queryFn: () => fetchItemSalesReport(params),
  })
}


