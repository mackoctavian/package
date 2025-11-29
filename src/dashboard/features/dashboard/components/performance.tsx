'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Search as SearchIcon,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { LoadingIndicator } from '@dashboard/components/data-loading-indicator'
import type { DashboardPerformance } from '@dashboard/hooks/use-dashboard-metrics'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type PerformanceProps = {
  loading: boolean
  performance?: DashboardPerformance
  formatCurrency: (value: number) => string
  formatNumber: (value: number) => string
  periodLabel?: string
  comparisonLabel?: string
  periodOptions: Array<{ value: string; label: string; description?: string }>
  onSelectPeriod: (value: string) => void
  selectedPeriod: string
  comparisonOptions: Array<{ value: number; label: string; description?: string }>
  selectedComparison: number
  onSelectComparison: (value: number) => void
}

type MetricDefinition = {
  key: string
  title: string
  current: number
  previous: number
  formatter: (value: number) => string
  subtitle?: string
}

function DeltaBadge({
  current,
  previous,
  loading,
  compact,
}: {
  current: number
  previous: number
  loading?: boolean
  compact?: boolean
}) {
  const baseClass = cn(
    'inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground',
    compact ? 'text-[11px]' : 'text-xs',
  )

  if (loading) {
    return <span className={baseClass}>—</span>
  }

  if (!Number.isFinite(previous) || previous === 0) {
    return (
      <span className={baseClass}>
        <ArrowUpRight className='h-3 w-3' />
        N/A
      </span>
    )
  }

  const delta = current - previous
  const percent = Math.abs((delta / previous) * 100)
  const positive = delta >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight

  return (
    <span
      className={cn(
        baseClass,
        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-destructive/10 text-destructive',
      )}
    >
      <Icon className='h-3 w-3' />
      {`${percent.toFixed(1)}%`}
    </span>
  )
}

function MetricDelta({
  current,
  previous,
  loading,
  comparisonCopy,
  compact,
}: {
  current: number
  previous: number
  loading?: boolean
  comparisonCopy: string
  compact?: boolean
}) {
  return (
    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
      <DeltaBadge current={current} previous={previous} loading={loading} compact={compact} />
      {!loading ? <span>{comparisonCopy}</span> : null}
    </div>
  )
}

type ControlOption<T> = {
  value: T
  label: string
  description?: string
}

function ControlDropdown<T extends string | number>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string
  value: T
  options: ControlOption<T>[]
  onSelect: (value: T) => void
}) {
  const selected = options.find((option) => option.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className={cn(
            'flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'border-border/60 bg-background text-foreground hover:border-border',
          )}
        >
          <span className='uppercase tracking-wide text-muted-foreground'>{label}</span>
          <span className='text-sm font-semibold text-foreground'>{selected?.label ?? 'Select'}</span>
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-[220px] rounded-xl border bg-popover p-1 shadow-lg'>
        {options.map((option) => {
          const isActive = option.value === value
          return (
            <DropdownMenuItem
              key={String(option.value)}
              className='flex flex-col gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground focus:bg-muted'
              onSelect={() => onSelect(option.value)}
            >
              <span className='flex items-center justify-between gap-3'>
                <span>{option.label}</span>
                {isActive ? <Check className='h-4 w-4 text-primary' /> : null}
              </span>
              {option.description ? (
                <span className='text-xs font-normal text-muted-foreground'>{option.description}</span>
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className='inline-flex items-center gap-2 text-xs font-medium text-muted-foreground'>
      <span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function PerformanceChart({
  loading,
  data,
  formatCurrency,
  interval,
}: {
  loading: boolean
  data: { label: string; current: number; previous: number }[]
  formatCurrency: (value: number) => string
  interval: 'day' | 'month'
}) {
  if (loading) {
    return (
      <div className='flex h-[320px] items-center justify-center'>
        <LoadingIndicator label='Loading performance…' />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className='text-muted-foreground flex h-[240px] items-center justify-center text-sm'>
        No performance data for the selected period.
      </div>
    )
  }

  return (
    <div className='flex flex-col'>
      <div className='h-[320px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={data} barGap={16}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              minTickGap={interval === 'day' ? 24 : 12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(Number(value))}
            />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(value: number) => formatCurrency(value)} />
            <Bar dataKey='current' name='Current period' fill='#2563eb' radius={[4, 4, 0, 0]} />
            <Bar dataKey='previous' name='Previous period' fill='hsl(var(--chart-2))' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className='flex flex-wrap items-center gap-4 pt-4'>
        <LegendSwatch color='#2563eb' label='Current period' />
        <LegendSwatch color='hsl(var(--chart-2))' label='Previous period' />
      </div>
    </div>
  )
}

function PrimaryMetricCard({
  metric,
  loading,
  comparisonCopy,
}: {
  metric: MetricDefinition
  loading: boolean
  comparisonCopy: string
}) {
  return (
    <div className='rounded-xl border bg-background px-5 py-6 shadow-sm'>
      <p className='text-muted-foreground text-sm font-medium'>{metric.title}</p>
      <div className='mt-3 text-3xl font-semibold tracking-tight leading-tight break-words break-all'>
        {loading ? '—' : metric.formatter(metric.current)}
      </div>
      <div className='mt-4'>
        <MetricDelta
          current={metric.current}
          previous={metric.previous}
          loading={loading}
          comparisonCopy={comparisonCopy}
        />
      </div>
    </div>
  )
}

function MetricCard({
  metric,
  loading,
  comparisonCopy,
}: {
  metric: MetricDefinition
  loading: boolean
  comparisonCopy: string
}) {
  return (
    <div className='rounded-xl border bg-background px-5 py-4 shadow-sm'>
      <p className='text-muted-foreground text-xs uppercase tracking-wide'>{metric.title}</p>
      <div className='mt-2 text-xl font-semibold leading-tight break-words break-all'>
        {loading ? '—' : metric.formatter(metric.current)}
      </div>
      <div className='mt-3'>
        <MetricDelta
          current={metric.current}
          previous={metric.previous}
          loading={loading}
          comparisonCopy={comparisonCopy}
          compact
        />
      </div>
    </div>
  )
}

function LocationsTable({
  loading,
  locations,
  formatCurrency,
  formatNumber,
  comparisonCopy,
  hasData,
}: {
  loading: boolean
  locations: DashboardPerformance['locations']
  formatCurrency: (value: number) => string
  formatNumber: (value: number) => string
  comparisonCopy: string
  hasData: boolean
}) {
  if (loading) {
    return (
      <div className='flex h-44 items-center justify-center'>
        <LoadingIndicator label='Loading locations…' />
      </div>
    )
  }

  if (!locations.length) {
    return (
      <div className='text-muted-foreground flex h-44 items-center justify-center text-sm'>
        {hasData ? 'No locations match your search.' : 'No location data for this period.'}
      </div>
    )
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[220px]'>Name</TableHead>
            <TableHead className='text-right'>Net sales</TableHead>
            <TableHead className='text-right'>Transactions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id} className='border-b last:border-b-0'>
              <TableCell>
                <div className='flex flex-col gap-1'>
                  <span className='font-medium leading-tight'>{location.nickname || location.name}</span>
                  <span className='text-muted-foreground text-xs leading-tight'>{location.name}</span>
                </div>
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex flex-col items-end gap-1'>
                  <span className='text-sm font-semibold'>{formatCurrency(location.netSales)}</span>
                  <MetricDelta
                    current={location.netSales}
                    previous={location.previousNetSales}
                    comparisonCopy={comparisonCopy}
                    compact
                  />
                </div>
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex flex-col items-end gap-1'>
                  <span className='text-sm font-semibold'>{formatNumber(location.transactions)}</span>
                  <MetricDelta
                    current={location.transactions}
                    previous={location.previousTransactions}
                    comparisonCopy={comparisonCopy}
                    compact
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function Performance({
  loading,
  performance,
  formatCurrency,
  formatNumber,
  periodLabel = 'This period',
  comparisonLabel = 'Previous period',
  periodOptions,
  onSelectPeriod,
  selectedPeriod,
  comparisonOptions,
  selectedComparison,
  onSelectComparison,
}: PerformanceProps) {
  const [locationSearch, setLocationSearch] = useState('')

  const chartData = useMemo(
    () =>
      (performance?.series ?? []).map((point) => ({
        label: point.label,
        current: point.currentValue,
        previous: point.previousValue,
      })),
    [performance?.series],
  )

  const summaryMetrics = useMemo<MetricDefinition[]>(() => {
    const current = performance?.current
    const comparison = performance?.comparison
    const fallback = 0

    const currentAverageSale = current?.averageSale ?? fallback
    const comparisonAverageSale = comparison?.averageSale ?? fallback

    return [
      {
        key: 'net-sales',
        title: 'Net sales',
        current: current?.netSales ?? fallback,
        previous: comparison?.netSales ?? fallback,
        formatter: formatCurrency,
      },
      {
        key: 'gross-sales',
        title: 'Gross sales',
        current: current?.grossSales ?? fallback,
        previous: comparison?.grossSales ?? fallback,
        formatter: formatCurrency,
      },
      {
        key: 'transactions',
        title: 'Transactions',
        current: current?.transactions ?? fallback,
        previous: comparison?.transactions ?? fallback,
        formatter: formatNumber,
      },
      {
        key: 'average-sale',
        title: 'Average sale',
        current: currentAverageSale,
        previous: comparisonAverageSale,
        formatter: formatCurrency,
      },
      {
        key: 'discounts',
        title: 'Comps & discounts',
        current: current?.discounts ?? fallback,
        previous: comparison?.discounts ?? fallback,
        formatter: formatCurrency,
      },
    ]
  }, [formatCurrency, formatNumber, performance])

  const [primaryMetric, ...secondaryMetrics] = summaryMetrics
  const comparisonDescriptor = comparisonLabel ?? 'previous period'
  const comparisonCopy = `vs ${comparisonDescriptor}`
  const comparisonSummary = `${periodLabel ?? 'This period'} vs ${comparisonDescriptor}`
  const locations = useMemo(
    () => performance?.locations ?? [],
    [performance?.locations],
  )

  const currentStartYear = performance?.current?.startDate
    ? new Date(performance.current.startDate).getFullYear()
    : undefined

  const dropdownComparisonOptions = useMemo(() => {
    const base = comparisonOptions ?? []
    if (!currentStartYear || !['this-year', 'last-year'].includes(selectedPeriod)) {
      return base
    }
    return base.map((option) => {
      if (option.description) return option
      return {
        ...option,
        description: String(currentStartYear - option.value),
      }
    })
  }, [comparisonOptions, currentStartYear, selectedPeriod])

  const filteredLocations = useMemo(() => {
    if (!locationSearch.trim()) return locations
    const term = locationSearch.trim().toLowerCase()
    return locations.filter((location) => {
      const name = `${location.name ?? ''} ${location.nickname ?? ''}`.toLowerCase()
      return name.includes(term)
    })
  }, [locations, locationSearch])

  return (
    <section className='space-y-6'>
      <div className='rounded-2xl border bg-card shadow-sm'>
        <div className='flex flex-wrap items-center justify-between gap-4 border-b px-6 py-5'>
          <div>
            <h2 className='text-xl font-semibold leading-tight text-foreground'>Performance</h2>
            <p className='text-muted-foreground text-sm'>
              {performance
                ? `Comparing ${comparisonSummary}.`
                : 'Performance insights will appear once we have enough data.'}
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <ControlDropdown
              label='Date'
              value={selectedPeriod}
              options={periodOptions}
              onSelect={onSelectPeriod}
            />
            <ControlDropdown
              label='vs'
              value={selectedComparison}
              options={dropdownComparisonOptions}
              onSelect={onSelectComparison}
            />
          </div>
        </div>

        <div className='space-y-8 px-6 py-6'>
          <div className='grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr]'>
            {primaryMetric ? (
              <PrimaryMetricCard
                metric={primaryMetric}
                loading={loading || !performance}
                comparisonCopy={comparisonCopy}
              />
            ) : null}
            <div className='rounded-xl border bg-background px-5 py-5 shadow-sm'>
              <PerformanceChart
                loading={loading}
                data={chartData}
                formatCurrency={formatCurrency}
                interval={performance?.interval ?? 'day'}
              />
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {secondaryMetrics.map((metric) => (
              <MetricCard
                key={metric.key}
                metric={metric}
                loading={loading || !performance}
                comparisonCopy={comparisonCopy}
              />
            ))}
          </div>

          <div className='space-y-4'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <h3 className='text-lg font-semibold leading-tight text-foreground'>Locations</h3>
                <p className='text-muted-foreground text-sm'>
                  {performance?.locations?.length
                    ? 'Performance by location for the selected period.'
                    : 'Add a location to view location performance insights.'}
                </p>
              </div>
              <div className='relative w-full max-w-sm'>
                <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={locationSearch}
                  onChange={(event) => setLocationSearch(event.target.value)}
                  placeholder='Search locations'
                  className='pl-9'
                />
              </div>
            </div>
            <div className='rounded-xl border bg-background'>
              <LocationsTable
                loading={loading}
                locations={filteredLocations}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                comparisonCopy={comparisonCopy}
                hasData={Boolean(performance?.locations?.length)}
              />
            </div>
            <div className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground'>
              <div>
                Results per page <span className='font-medium text-foreground'>10</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='rounded-full border px-2 py-1'>‹</span>
                <span className='font-medium text-foreground'>Page 1 of 1</span>
                <span className='rounded-full border px-2 py-1'>›</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


