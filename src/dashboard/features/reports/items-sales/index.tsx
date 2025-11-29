"use client"

import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingIndicator } from '@dashboard/components/data-loading-indicator'
import { Header } from '@dashboard/components/layout/header'
import { Main } from '@dashboard/components/layout/main'
import { Search } from '@dashboard/components/search'
import { ThemeSwitch } from '@dashboard/components/theme-switch'
import { ConfigDrawer } from '@dashboard/components/config-drawer'
import { ProfileDropdown } from '@dashboard/components/profile-dropdown'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import { createCurrencyFormatter, getCurrencyConfig } from '@dashboard/lib/currency'
import { useItemSalesReport } from '@dashboard/hooks/use-items-sales-report'

type RangeOption = {
  value: '7d' | '30d' | '90d' | 'this-year' | 'last-year'
  label: string
}

const RANGE_OPTIONS: RangeOption[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'this-year', label: 'This year' },
  { value: 'last-year', label: 'Last year' },
]

function computeRange(value: RangeOption['value']) {
  const end = new Date()
  const start = new Date(end)
  start.setHours(0, 0, 0, 0)

  if (value === 'this-year') {
    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  }

  if (value === 'last-year') {
    const lastYear = end.getFullYear() - 1
    const startOfLastYear = new Date(lastYear, 0, 1)
    const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59, 999)
    return {
      startDate: startOfLastYear.toISOString(),
      endDate: endOfLastYear.toISOString(),
    }
  }

  const days = value === '7d' ? 7 : value === '90d' ? 90 : 30
  start.setDate(start.getDate() - days)
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

function SummaryCard({ title, value, description }: { title: string; value: string; description?: string }) {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardDescription>{title}</CardDescription>
        <CardTitle className='text-3xl font-semibold tracking-tight leading-tight break-words break-all'>
          {value}
        </CardTitle>
      </CardHeader>
      {description ? <CardContent className='text-muted-foreground text-sm'>{description}</CardContent> : null}
    </Card>
  )
}

const CHART_COLORS = ['#2563eb', '#1d4ed8', '#60a5fa', '#93c5fd', '#3b82f6']

export function ItemSalesReport() {
  const [range, setRange] = useState<RangeOption['value']>('30d')
  const { data: sidebarInfo } = useSidebarInfo()
  const sidebarLocations = sidebarInfo?.locations
  const locations = useMemo(
    () => sidebarLocations ?? [],
    [sidebarLocations],
  )
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([])
  const { startDate, endDate } = useMemo(() => computeRange(range), [range])

  const allLocationIds = useMemo(() => locations.map((location) => location.id), [locations])

  const locationsKey = useMemo(
    () => allLocationIds.slice().sort().join('|'),
    [allLocationIds],
  )

  useEffect(() => {
    if (allLocationIds.length > 0) {
      setSelectedLocationIds(allLocationIds)
    } else {
      setSelectedLocationIds([])
    }
  }, [allLocationIds, locationsKey])

  const locationSelection =
    selectedLocationIds.length === 0 ? undefined : selectedLocationIds.filter((id) => allLocationIds.includes(id))
  const allSelected =
    allLocationIds.length > 0 && selectedLocationIds.length === allLocationIds.length
  const effectiveLocationIds =
    !locationSelection || locationSelection.length === 0 || allSelected ? undefined : locationSelection

  const { data, isLoading, isError, error } = useItemSalesReport({
    locationIds: effectiveLocationIds,
    startDate,
    endDate,
  })

  const currencyConfig = useMemo(() => getCurrencyConfig(), [])
  const currencyFormatter = useMemo(() => createCurrencyFormatter(currencyConfig), [currencyConfig])
  const formatCurrency = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0)
  const formatNumber = (value: number) => new Intl.NumberFormat().format(Number.isFinite(value) ? value : 0)

  const loading = isLoading
  const loadError = isError ? (error instanceof Error ? error.message : 'Unknown error') : null
  const initialLoad = loading && !data

  const chartSeries = useMemo(() => data?.chart.series ?? [], [data?.chart?.series])
  const chartData = useMemo(
    () => (data?.chart.data as Array<Record<string, number | string>> | undefined) ?? [],
    [data?.chart?.data],
  )
  const hasChartData = Boolean(chartSeries.length && chartData.length)
  const seriesColors = useMemo(() => {
    const map = new Map<string, string>()
    chartSeries.forEach((series, index) => {
      map.set(series.id, CHART_COLORS[index % CHART_COLORS.length])
    })
    return map
  }, [chartSeries])

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Item sales</h1>
            <p className='text-muted-foreground text-sm'>
              Visualize best-selling items and review detailed sales performance by product.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='min-w-[200px] justify-between'>
                  <span>
                    {allLocationIds.length === 0
                      ? 'No locations'
                      : allSelected
                        ? 'All locations'
                        : selectedLocationIds.length === 0
                          ? 'All locations'
                          : `${selectedLocationIds.length} selected`}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align='end' className='w-64 p-0'>
                <div className='border-b px-3 py-2 text-sm font-semibold'>Locations</div>
                <div className='space-y-2 px-3 py-2'>
                  <label className='flex items-center gap-2 text-sm font-medium'>
                    <Checkbox
                      checked={allSelected || selectedLocationIds.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLocationIds(allLocationIds)
                        } else {
                          setSelectedLocationIds([])
                        }
                      }}
                    />
                    All locations
                  </label>
                  <div className='max-h-48 space-y-2 overflow-y-auto pr-1'>
                    {locations.map((location) => {
                      const isChecked =
                        allSelected || selectedLocationIds.includes(location.id)
                      return (
                        <label key={location.id} className='flex items-center gap-2 text-sm'>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const next = Array.from(new Set([...selectedLocationIds, location.id]))
                                setSelectedLocationIds(
                                  next.length >= allLocationIds.length ? allLocationIds : next,
                                )
                              } else {
                                const next = selectedLocationIds.filter((id) => id !== location.id)
                                setSelectedLocationIds(next)
                              }
                            }}
                          />
                          {location.nickname ?? location.name ?? 'Location'}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Select value={range} onValueChange={(value: RangeOption['value']) => setRange(value)}>
              <SelectTrigger className='w-44'>
                <SelectValue placeholder='Select range' />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loadError ? (
          <div className='text-destructive rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm'>
            Failed to load item sales report: {loadError}
          </div>
        ) : initialLoad ? (
          <div className='flex min-h-[480px] items-center justify-center rounded-xl border bg-background'>
            <LoadingIndicator label='Loading item sales report…' />
          </div>
        ) : (
          <>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <SummaryCard
                title='Gross sales'
                value={formatCurrency(data?.summary.totalGrossSales ?? 0)}
                description='Before discounts'
              />
              <SummaryCard
                title='Net sales'
                value={formatCurrency(data?.summary.totalNetSales ?? 0)}
                description='After discounts'
              />
              <SummaryCard
                title='Discounts & comps'
                value={formatCurrency(data?.summary.totalDiscounts ?? 0)}
                description='Total discounts granted'
              />
              <SummaryCard
                title='Quantity sold'
                value={formatNumber(data?.summary.totalQuantity ?? 0)}
                description='Units sold across items'
              />
            </div>

            <Card>
              <CardHeader className='flex flex-col gap-1 md:flex-row md:items-center md:justify-between'>
                <div>
                  <CardTitle>Sales trend by item</CardTitle>
                  <CardDescription>
                    {data?.summary
                      ? `${new Date(data.summary.startDate).toLocaleDateString()} – ${new Date(data.summary.endDate).toLocaleDateString()}`
                      : 'No data available'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className='h-[320px] pt-2'>
                {loading ? (
                  <div className='flex h-full items-center justify-center'>
                    <LoadingIndicator label='Loading charts…' />
                  </div>
                ) : !hasChartData ? (
                  <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>No chart data for the selected filters.</div>
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={chartData} margin={{ top: 24, right: 24, left: 0, bottom: 0 }} barGap={12}>
                      <CartesianGrid strokeDasharray='4 8' vertical={false} />
                      <XAxis dataKey='label' tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tickLine={false} axisLine={false} width={120} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(Number(value))}
                        labelFormatter={(label) => label}
                        contentStyle={{ borderRadius: 12 }}
                      />
                      <Legend />
                      {chartSeries.map((series, index) => (
                        <Bar
                          key={series.id}
                          dataKey={series.id}
                          name={series.name}
                          fill={seriesColors.get(series.id) ?? CHART_COLORS[index % CHART_COLORS.length]}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-col gap-1 md:flex-row md:items-center md:justify-between'>
                <div>
                  <CardTitle>Items breakdown</CardTitle>
                  <CardDescription>Detailed performance for each item.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                {loading ? (
                  <div className='flex h-40 items-center justify-center'>
                    <LoadingIndicator label='Loading items…' />
                  </div>
                ) : data?.items?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className='text-right'>Gross sales</TableHead>
                        <TableHead className='text-right'>Discounts & comps</TableHead>
                        <TableHead className='text-right'>Net sales</TableHead>
                        <TableHead className='text-right'>Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className='font-medium'>{item.name}</TableCell>
                          <TableCell>{item.category || 'Uncategorized'}</TableCell>
                          <TableCell className='text-right'>{formatCurrency(item.grossSales)}</TableCell>
                          <TableCell className='text-right'>{formatCurrency(item.discounts)}</TableCell>
                          <TableCell className='text-right'>{formatCurrency(item.netSales)}</TableCell>
                          <TableCell className='text-right'>{formatNumber(item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className='text-muted-foreground flex h-40 items-center justify-center text-sm'>No items found for the selected filters.</div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Main>
    </>
  )
}


