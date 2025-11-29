"use client"

import { useQuery } from '@tanstack/react-query'

export type TeamSalesSummary = {
  totalSales: number
  totalCommission: number
  teamCount: number
  totalSaleCount: number
  averageSaleValue: number
  startDate: string
  endDate: string
}

export type TeamSalesRow = {
  id: string
  name: string
  location: string
  sales: number
  commission: number
  saleCount: number
  averageSale: number
}

export type TeamSalesChartSeries = {
  id: string
  name: string
}

export type TeamSalesChartPoint = {
  label: string
  bucket: string
  [seriesId: string]: string | number
}

export type TeamSalesReportResponse = {
  summary: TeamSalesSummary
  chart: {
    series: TeamSalesChartSeries[]
    data: TeamSalesChartPoint[]
  }
  teams: TeamSalesRow[]
}

export type UseTeamSalesReportParams = {
  locationIds?: string[] | null
  startDate?: string
  endDate?: string
}

async function fetchTeamSalesReport(params: UseTeamSalesReportParams = {}) {
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
    `/api/dashboard/reports/team-sales${search.toString() ? `?${search.toString()}` : ''}`,
    { cache: 'no-store' },
  )

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to load team sales report')
  }

  return (await response.json()) as TeamSalesReportResponse
}

export function useTeamSalesReport(params: UseTeamSalesReportParams) {
  const locationKey =
    params.locationIds && params.locationIds.length > 0
      ? [...params.locationIds].sort()
      : null

  return useQuery({
    queryKey: ['team-sales-report', locationKey, params.startDate ?? null, params.endDate ?? null],
    queryFn: () => fetchTeamSalesReport(params),
  })
}


