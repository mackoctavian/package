"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@dashboard/components/config-drawer'
import { Header } from '@dashboard/components/layout/header'
import { Main } from '@dashboard/components/layout/main'
import { TopNav } from '@dashboard/components/layout/top-nav'
import { ProfileDropdown } from '@dashboard/components/profile-dropdown'
import { Search } from '@dashboard/components/search'
import { ThemeSwitch } from '@dashboard/components/theme-switch'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import { useDashboardMetrics } from '@dashboard/hooks/use-dashboard-metrics'
import {
  createCurrencyFormatter,
  formatAxisTickValue,
  getCurrencyConfig,
} from '@dashboard/lib/currency'
import { LoadingIndicator } from '@dashboard/components/data-loading-indicator'
import { Overview } from './components/overview'
import { RecentSales } from './components/recent-sales'
import { Performance } from './components/performance'

type RangeOption = {
  value: 'today' | '7d' | '30d' | '90d' | 'this-year' | 'last-year'
  label: string
  description?: string
}

const RANGE_OPTIONS: RangeOption[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'this-year', label: 'This year' },
  { value: 'last-year', label: 'Last year' },
]

type ComparisonOption = {
  value: number
  label: string
}

function getRangeLabel(value: RangeOption['value']) {
  return RANGE_OPTIONS.find((option) => option.value === value)?.label ?? 'Custom'
}

function getRangeDescription(value: RangeOption['value']) {
  const now = new Date()
  switch (value) {
    case 'today':
      return now.toLocaleDateString()
    case '7d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      return `${start.toLocaleDateString()} – ${now.toLocaleDateString()}`
    }
    case '30d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 29)
      return `${start.toLocaleDateString()} – ${now.toLocaleDateString()}`
    }
    case '90d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 89)
      return `${start.toLocaleDateString()} – ${now.toLocaleDateString()}`
    }
    case 'this-year':
      return `${now.getFullYear()}`
    case 'last-year':
      return `${now.getFullYear() - 1}`
    default:
      return ''
  }
}

function getComparisonLabel(range: RangeOption['value'], offset: number) {
  if (range === 'this-year' || range === 'last-year') {
    if (offset === 1) return 'Prior year'
    return `${offset} years prior`
  }

  if (range === 'today') {
    if (offset === 1) return 'Prior day'
    return `${offset} days prior`
  }

  const rangeLabel = RANGE_OPTIONS.find((option) => option.value === range)?.label ?? 'Previous period'

  if (offset === 1) {
    switch (range) {
      case '7d':
        return 'Previous 7 days'
      case '30d':
        return 'Previous 30 days'
      case '90d':
        return 'Previous 90 days'
      default:
        return rangeLabel
    }
  }

  if (range === '7d' || range === '30d' || range === '90d') {
    return `${offset} periods prior`
  }

  return `${offset} periods prior`
}

function getComparisonOptions(range: RangeOption['value']): ComparisonOption[] {
  const offsets = [1, 2, 3]
  return offsets.map((offset) => ({
    value: offset,
    label: getComparisonLabel(range, offset),
  }))
}

function computeRange(value: RangeOption['value']) {
  const end = new Date()
  const start = new Date(end)
  start.setHours(0, 0, 0, 0)

  if (value === 'today') {
    const endOfDay = new Date(start)
    endOfDay.setHours(23, 59, 59, 999)
    return {
      startDate: start.toISOString(),
      endDate: endOfDay.toISOString(),
    }
  }

  if (value === 'this-year') {
    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
    const endOfDay = new Date(end)
    endOfDay.setHours(23, 59, 59, 999)
    return {
      startDate: start.toISOString(),
      endDate: endOfDay.toISOString(),
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
  const endOfDay = new Date(end)
  endOfDay.setHours(23, 59, 59, 999)
  return {
    startDate: start.toISOString(),
    endDate: endOfDay.toISOString(),
  }
}

function formatDateRange(startIso: string, endIso: string) {
  const startDate = new Date(startIso)
  const endDate = new Date(endIso)
  const startLabel = startDate.toLocaleDateString()
  const endLabel = endDate.toLocaleDateString()
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`
}

export function Dashboard() {
  const pathname = usePathname()
  const { data: sidebarInfo } = useSidebarInfo()
  const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview')
  const [overviewRange, setOverviewRange] = useState<RangeOption['value']>('today')
  const [overviewComparisonOffset, setOverviewComparisonOffset] = useState<number>(1)
  const [performanceRange, setPerformanceRange] = useState<RangeOption['value']>('today')
  const [performanceComparisonOffset, setPerformanceComparisonOffset] = useState<number>(1)

  const locations = useMemo(() => sidebarInfo?.locations ?? [], [sidebarInfo?.locations])
  const allLocationIds = useMemo(() => locations.map((location) => location.id), [locations])
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([])

  useEffect(() => {
    if (allLocationIds.length > 0) {
      setSelectedLocationIds(allLocationIds)
    } else {
      setSelectedLocationIds([])
    }
  }, [allLocationIds])

  const { startDate: overviewStartDate, endDate: overviewEndDate } = useMemo(
    () => computeRange(overviewRange),
    [overviewRange],
  )
  const { startDate: performanceStartDate, endDate: performanceEndDate } = useMemo(
    () => computeRange(performanceRange),
    [performanceRange],
  )

  const allSelected = allLocationIds.length > 0 && selectedLocationIds.length === allLocationIds.length
  const effectiveLocationIds =
    !selectedLocationIds.length || allSelected ? undefined : selectedLocationIds

  const overviewMetricsQuery = useDashboardMetrics({
    locationIds: effectiveLocationIds,
    startDate: overviewStartDate,
    endDate: overviewEndDate,
    comparisonOffset: overviewComparisonOffset,
  })
  const performanceMetricsQuery = useDashboardMetrics({
    locationIds: effectiveLocationIds,
    startDate: performanceStartDate,
    endDate: performanceEndDate,
    comparisonOffset: performanceComparisonOffset,
  })

  const overviewLoading = overviewMetricsQuery.isLoading
  const performanceLoading = performanceMetricsQuery.isLoading
  const overviewMetrics = overviewMetricsQuery.data
  const performanceMetrics = performanceMetricsQuery.data
  const isInitialMetricsLoading = overviewLoading && !overviewMetrics

  const currencyConfig = useMemo(() => getCurrencyConfig(), [])
  const currencyFormatter = useMemo(
    () => createCurrencyFormatter(currencyConfig),
    [currencyConfig]
  )
  const formatCurrency = useCallback(
    (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0),
    [currencyFormatter]
  )
  const formatPlainNumber = useCallback(
    (value: number) => new Intl.NumberFormat().format(Number.isFinite(value) ? value : 0),
    []
  )
  const formatYAxisTick = useCallback(
    (value: number) => formatAxisTickValue(value, currencyConfig),
    [currencyConfig]
  )

  const selectionLabel = useMemo(() => {
    if (!locations.length) return 'All locations'
    if (!selectedLocationIds.length || allSelected) return 'All locations'
    if (selectedLocationIds.length === 1) {
      const match = locations.find((location) => location.id === selectedLocationIds[0])
      return match?.nickname ?? match?.name ?? 'Location'
    }
    return `${selectedLocationIds.length} locations`
  }, [locations, selectedLocationIds, allSelected])

  const appliedStartDate = overviewMetrics?.startDate ?? overviewStartDate
  const appliedEndDate = overviewMetrics?.endDate ?? overviewEndDate
  const rangeSummary = formatDateRange(appliedStartDate, appliedEndDate)
  const hasLocations = locations.length > 0
  const filtersSummary = hasLocations
    ? `${selectionLabel} • ${rangeSummary}`
    : 'Add a location to view sales performance'

  const monthlySales = overviewMetrics?.monthlySales ?? []
  const recentSales = overviewMetrics?.recentSales ?? []
  const transactionCount = overviewMetrics?.transactions ?? 0
  const performanceDateOptions = useMemo(
    () =>
      RANGE_OPTIONS.map((option) => ({
        ...option,
        description: getRangeDescription(option.value),
      })),
    [],
  )
  const overviewComparisonOptions = useMemo(() => getComparisonOptions(overviewRange), [overviewRange])
  const performanceComparisonOptions = useMemo(() => getComparisonOptions(performanceRange), [performanceRange])

  useEffect(() => {
    if (!overviewComparisonOptions.some((option) => option.value === overviewComparisonOffset)) {
      setOverviewComparisonOffset(1)
    }
  }, [overviewComparisonOptions, overviewComparisonOffset])

  useEffect(() => {
    if (!performanceComparisonOptions.some((option) => option.value === performanceComparisonOffset)) {
      setPerformanceComparisonOffset(1)
    }
  }, [performanceComparisonOptions, performanceComparisonOffset])

  const performancePeriodLabel = useMemo(() => getRangeLabel(performanceRange), [performanceRange])
  const performanceComparisonLabel = useMemo(
    () =>
      performanceComparisonOptions.find((option) => option.value === performanceComparisonOffset)?.label ??
      'Previous period',
    [performanceComparisonOptions, performanceComparisonOffset],
  )

  const topNav = useMemo(
    () =>
      [
        {
          title: 'Overview',
          href: '/dashboard',
        },
        {
          title: 'Customers',
          href: '/dashboard/customers',
          disabled: true,
        },
        {
          title: 'Products',
          href: '/dashboard/products',
          disabled: true,
        },
        {
          title: 'Settings',
          href: '/dashboard/settings',
          disabled: true,
        },
      ].map((link) => ({
        ...link,
        isActive:
          link.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(link.href),
      })),
    [pathname]
  )

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {isInitialMetricsLoading ? (
          <div className='flex min-h-[480px] items-center justify-center rounded-xl border bg-background'>
            <LoadingIndicator label='Loading dashboard…' />
          </div>
        ) : (
          <>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-4'>
              <div className='space-y-1'>
                <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
                <p className='text-muted-foreground text-sm'>Monitor sales performance across locations.</p>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='min-w-[200px] justify-between'
                      disabled={!locations.length}
                    >
                      <span>{locations.length ? selectionLabel : 'No locations available'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align='end' className='w-64 p-0'>
                    {locations.length ? (
                      <div>
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
                                selectedLocationIds.length === 0 ||
                                allSelected ||
                                selectedLocationIds.includes(location.id)
                              return (
                                <label key={location.id} className='flex items-center gap-2 text-sm'>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        let next: string[]
                                        if (selectedLocationIds.length === 0 || allSelected) {
                                          next = allLocationIds
                                        } else {
                                          next = Array.from(new Set([...selectedLocationIds, location.id]))
                                        }
                                        setSelectedLocationIds(
                                          next.length >= allLocationIds.length ? allLocationIds : next,
                                        )
                                      } else {
                                        if (selectedLocationIds.length === 0 || allSelected) {
                                          const next = allLocationIds.filter((id) => id !== location.id)
                                          setSelectedLocationIds(next)
                                        } else {
                                          const next = selectedLocationIds.filter((id) => id !== location.id)
                                          setSelectedLocationIds(next)
                                        }
                                      }
                                    }}
                                  />
                                  {location.nickname ?? location.name ?? 'Location'}
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='px-3 py-4 text-sm text-muted-foreground'>No locations available.</div>
                    )}
                  </PopoverContent>
                </Popover>

                <Select
                  value={overviewRange}
                  onValueChange={(value: RangeOption['value']) => setOverviewRange(value)}
                >
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
            <Tabs
              orientation='vertical'
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'overview' | 'performance')}
              className='space-y-4'
            >
              <div className='w-full overflow-x-auto pb-2'>
                <TabsList>
                  <TabsTrigger value='overview'>Overview</TabsTrigger>
                  <TabsTrigger value='performance'>Performance</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value='overview' className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>Net Sales</CardTitle>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        className='text-muted-foreground h-4 w-4'
                      >
                        <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold leading-tight break-words break-all'>
                        {hasLocations
                          ? overviewLoading
                            ? '—'
                            : formatCurrency(overviewMetrics?.netSales ?? 0)
                          : '—'}
                      </div>
                      <p className='text-muted-foreground text-xs'>{filtersSummary}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>Gross Sales</CardTitle>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        className='text-muted-foreground h-4 w-4'
                      >
                        <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
                        <circle cx='9' cy='7' r='4' />
                        <path d='M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold leading-tight break-words break-all'>
                        {hasLocations
                          ? overviewLoading
                            ? '—'
                            : formatCurrency(overviewMetrics?.grossSales ?? 0)
                          : '—'}
                      </div>
                      <p className='text-muted-foreground text-xs'>{filtersSummary}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>Discounts &amp; Comps</CardTitle>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        className='text-muted-foreground h-4 w-4'
                      >
                        <rect width='20' height='14' x='2' y='5' rx='2' />
                        <path d='M2 10h20' />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold leading-tight break-words break-all'>
                        {hasLocations
                          ? overviewLoading
                            ? '—'
                            : formatCurrency(overviewMetrics?.discounts ?? 0)
                          : '—'}
                      </div>
                      <p className='text-muted-foreground text-xs'>{filtersSummary}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>Transactions</CardTitle>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        className='text-muted-foreground h-4 w-4'
                      >
                        <path d='M22 12h-4l-3 9L9 3l-3 9H2' />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold leading-tight break-words break-all'>
                        {hasLocations
                          ? overviewLoading
                            ? '—'
                            : (overviewMetrics?.transactions ?? 0).toLocaleString()
                          : '—'}
                      </div>
                      <p className='text-muted-foreground text-xs'>{filtersSummary}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
                  <Card className='col-span-1 lg:col-span-4'>
                    <CardHeader>
                      <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className='ps-2'>
                      {overviewLoading ? (
                        <div className='flex h-[350px] items-center justify-center'>
                          <LoadingIndicator label='Loading overview…' />
                        </div>
                      ) : (
                        <Overview data={monthlySales} formatTick={formatYAxisTick} />
                      )}
                    </CardContent>
                  </Card>
                  <Card className='col-span-1 lg:col-span-3'>
                    <CardHeader>
                      <CardTitle>Recent Sales</CardTitle>
                      <CardDescription>
                        {hasLocations
                          ? `You recorded ${transactionCount.toLocaleString()} transactions in this period.`
                          : 'Add a location to view recent sales.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {overviewLoading ? (
                        <div className='flex h-40 items-center justify-center'>
                          <LoadingIndicator label='Loading recent sales…' />
                        </div>
                      ) : (
                        <RecentSales sales={recentSales} formatAmount={formatCurrency} />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value='performance' className='space-y-4'>
                <Performance
                  loading={performanceLoading}
                  performance={performanceMetrics?.performance}
                  formatCurrency={formatCurrency}
                  formatNumber={formatPlainNumber}
                  periodLabel={performancePeriodLabel}
                  comparisonLabel={performanceComparisonLabel}
                  periodOptions={performanceDateOptions}
                  onSelectPeriod={(value) => setPerformanceRange(value as RangeOption['value'])}
                  selectedPeriod={performanceRange}
                  comparisonOptions={performanceComparisonOptions}
                  selectedComparison={performanceComparisonOffset}
                  onSelectComparison={setPerformanceComparisonOffset}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </Main>
    </>
  )
}

