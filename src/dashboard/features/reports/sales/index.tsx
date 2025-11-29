"use client"

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Header } from '@dashboard/components/layout/header'
import { Main } from '@dashboard/components/layout/main'
import { Search } from '@dashboard/components/search'
import { ThemeSwitch } from '@dashboard/components/theme-switch'
import { ConfigDrawer } from '@dashboard/components/config-drawer'
import { ProfileDropdown } from '@dashboard/components/profile-dropdown'
import { useSelectedLocationStore } from '@dashboard/store/selected-location'
import { useSalesReport } from '@dashboard/hooks/use-sales-report'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import { createCurrencyFormatter, getCurrencyConfig } from '@dashboard/lib/currency'
import { LoadingIndicator } from '@dashboard/components/data-loading-indicator'

type RangeOption = {
  value: '7d' | '30d' | '90d'
  label: string
}

const RANGE_OPTIONS: RangeOption[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

function computeRange(value: RangeOption['value']) {
  const end = new Date()
  const start = new Date(end)
  const days = value === '7d' ? 7 : value === '90d' ? 90 : 30
  start.setHours(0, 0, 0, 0)
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

type SimpleTableProps<T extends { id: string }> = {
  title: string
  description?: string
  data: T[]
  emptyLabel: string
  columns: Array<{ key: keyof T; header: string; align?: 'left' | 'right' }>
  formatValue?: (key: keyof T, value: unknown) => string
}

function SimpleTable<T extends { id: string }>({
  title,
  description,
  data,
  emptyLabel,
  columns,
  formatValue,
}: SimpleTableProps<T>) {
  return (
    <Card>
      <CardHeader className='pb-4'>
        <CardTitle className='text-base font-semibold'>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className='pt-0'>
        {data.length === 0 ? (
          <div className='text-muted-foreground flex h-40 items-center justify-center text-sm'>{emptyLabel}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={String(column.key)} className={column.align === 'right' ? 'text-right' : ''}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => {
                    const rawValue = row[column.key]
                    const display = formatValue ? formatValue(column.key, rawValue) : String(rawValue ?? '—')
                    return (
                      <TableCell key={String(column.key)} className={column.align === 'right' ? 'text-right' : ''}>
                        {display}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export function SalesReport() {
  const [range, setRange] = useState<RangeOption['value']>('30d')
  const { selectedLocationId } = useSelectedLocationStore()
  const { data: sidebarInfo } = useSidebarInfo()

  const { startDate, endDate } = useMemo(() => computeRange(range), [range])

  const { data, isLoading, isError, error } = useSalesReport({
    locationId: selectedLocationId,
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

  const summary = data?.summary
  const trend = data?.trend ?? []
  const topItems = data?.topItems ?? []
  const categories = data?.categories ?? []
  const departments = data?.departments ?? []
  const team = data?.team ?? []

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
            <h1 className='text-2xl font-bold tracking-tight'>Sales report</h1>
            <p className='text-muted-foreground text-sm'>Detailed performance across items, categories, departments, and team members.</p>
          </div>
          <div className='flex items-center gap-2'>
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
            Failed to load sales report: {loadError}
          </div>
        ) : initialLoad ? (
          <div className='flex min-h-[480px] items-center justify-center rounded-xl border bg-background'>
            <LoadingIndicator label='Loading sales report…' />
          </div>
        ) : (
          <>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <SummaryCard title='Gross sales' value={formatCurrency(summary?.grossSales ?? 0)} description='Before discounts' />
              <SummaryCard title='Net sales' value={formatCurrency(summary?.netSales ?? 0)} description='After discounts' />
              <SummaryCard title='Transactions' value={formatNumber(summary?.transactions ?? 0)} description='Completed orders' />
              <SummaryCard title='Average order value' value={formatCurrency(summary?.averageOrderValue ?? 0)} description='Net sales / transactions' />
            </div>

            <Card>
              <CardHeader className='flex flex-col gap-1 md:flex-row md:items-center md:justify-between'>
                <div>
                  <CardTitle>Sales trend</CardTitle>
                  <CardDescription>
                    {summary
                      ? `${new Date(summary.startDate).toLocaleDateString()} – ${new Date(summary.endDate).toLocaleDateString()}`
                      : 'No data available'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className='h-[320px] pt-2'>
                {trend.length === 0 ? (
                  <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>No sales activity for the selected period.</div>
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={trend} margin={{ top: 24, right: 24, left: 0, bottom: 0 }} barGap={12}>
                      <CartesianGrid strokeDasharray='4 8' vertical={false} />
                      <XAxis dataKey='label' tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tickLine={false} axisLine={false} width={120} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(Number(value))}
                        labelFormatter={(label) => label}
                        contentStyle={{ borderRadius: 12 }}
                      />
                      <Bar dataKey='netSales' fill='#2563eb' name='Net sales' radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <SimpleTable
                title='Top items'
                description='Best sellers by revenue'
                data={topItems}
                emptyLabel='No item sales in this period.'
                columns={[
                  { key: 'name', header: 'Item' },
                  { key: 'grossSales', header: 'Gross sales', align: 'right' },
                  { key: 'quantity', header: 'Qty', align: 'right' },
                ]}
                formatValue={(key, value) => {
                  if (key === 'grossSales') return formatCurrency(Number(value ?? 0))
                  if (key === 'quantity') return formatNumber(Number(value ?? 0))
                  return String(value ?? '—')
                }}
              />

              <SimpleTable
                title='Categories'
                description='Revenue by product category'
                data={categories}
                emptyLabel='No category sales in this period.'
                columns={[
                  { key: 'name', header: 'Category' },
                  { key: 'grossSales', header: 'Gross sales', align: 'right' },
                ]}
                formatValue={(key, value) => (key === 'grossSales' ? formatCurrency(Number(value ?? 0)) : String(value ?? '—'))}
              />

              <SimpleTable
                title='Departments'
                description='Revenue by department'
                data={departments}
                emptyLabel='No department sales in this period.'
                columns={[
                  { key: 'name', header: 'Department' },
                  { key: 'grossSales', header: 'Gross sales', align: 'right' },
                ]}
                formatValue={(key, value) => (key === 'grossSales' ? formatCurrency(Number(value ?? 0)) : String(value ?? '—'))}
              />

              <SimpleTable
                title='Team performance'
                description='Sales attributed to team members'
                data={team}
                emptyLabel='No team sales recorded.'
                columns={[
                  { key: 'name', header: 'Team member' },
                  { key: 'saleAmount', header: 'Sales', align: 'right' },
                  { key: 'commissionAmount', header: 'Commission', align: 'right' },
                ]}
                formatValue={(key, value) => {
                  if (key === 'saleAmount' || key === 'commissionAmount') {
                    return formatCurrency(Number(value ?? 0))
                  }
                  return String(value ?? '—')
                }}
              />
            </div>
          </>
        )}
      </Main>
    </>
  )
}

