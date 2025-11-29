"use client"

import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { Header } from '@dashboard/components/layout/header'
import { Main } from '@dashboard/components/layout/main'
import { Search } from '@dashboard/components/search'
import { ThemeSwitch } from '@dashboard/components/theme-switch'
import { ConfigDrawer } from '@dashboard/components/config-drawer'
import { ProfileDropdown } from '@dashboard/components/profile-dropdown'
import { useExpenseReport } from '@dashboard/hooks/use-expense-report'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import { createCurrencyFormatter, getCurrencyConfig } from '@dashboard/lib/currency'
import { LoadingIndicator } from '@dashboard/components/data-loading-indicator'

type RangeOption = {
  value: '30d' | '90d' | '180d'
  label: string
}

const RANGE_OPTIONS: RangeOption[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '180d', label: 'Last 180 days' },
]

function computeRange(value: RangeOption['value']) {
  const end = new Date()
  const start = new Date(end)
  const days = value === '180d' ? 180 : value === '90d' ? 90 : 30
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

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
  outstanding: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100',
  partial: 'bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-100',
  overdue: 'bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-100',
  draft: 'bg-muted text-muted-foreground',
}

export function ExpensesReport() {
  const [range, setRange] = useState<RangeOption['value']>('90d')
  const { data: sidebarInfo } = useSidebarInfo()
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

  const { startDate, endDate } = useMemo(() => computeRange(range), [range])

  const allSelected = allLocationIds.length > 0 && selectedLocationIds.length === allLocationIds.length
  const effectiveLocationIds =
    !selectedLocationIds.length || allSelected ? undefined : selectedLocationIds

  const { data, isLoading, isError, error } = useExpenseReport({
    locationIds: effectiveLocationIds,
    startDate,
    endDate,
  })

  const currencyConfig = useMemo(() => getCurrencyConfig(), [])
  const currencyFormatter = useMemo(() => createCurrencyFormatter(currencyConfig), [currencyConfig])
  const formatCurrency = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0)
 
  const loading = isLoading
  const loadError = isError ? (error instanceof Error ? error.message : 'Unknown error') : null
  const initialLoad = loading && !data
 
  const summary = data?.summary
  const trend = data?.trend ?? []
  const categories = data?.categories ?? []
  const expenses = data?.expenses ?? []
  const payments = data?.payments ?? []
 
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
            <h1 className='text-2xl font-bold tracking-tight'>Expenses report</h1>
            <p className='text-muted-foreground text-sm'>Monitor business spending, outstanding bills, and recent payments.</p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='min-w-[200px] justify-between'
                  disabled={!locations.length}
                >
                  <span>
                    {locations.length === 0
                      ? 'No locations available'
                      : allSelected || selectedLocationIds.length === 0
                        ? 'All locations'
                        : selectedLocationIds.length === 1
                          ? locations.find((loc) => loc.id === selectedLocationIds[0])?.nickname ??
                            locations.find((loc) => loc.id === selectedLocationIds[0])?.name ??
                            'Location'
                          : `${selectedLocationIds.length} locations`}
                  </span>
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
                                    if (selectedLocationIds.length === 0 || allSelected) {
                                      setSelectedLocationIds(allLocationIds)
                                    } else {
                                      const next = Array.from(new Set([...selectedLocationIds, location.id]))
                                      setSelectedLocationIds(
                                        next.length >= allLocationIds.length ? allLocationIds : next,
                                      )
                                    }
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
            Failed to load expenses report: {loadError}
          </div>
        ) : initialLoad ? (
          <div className='flex min-h-[480px] items-center justify-center rounded-xl border bg-background'>
            <LoadingIndicator label='Loading expenses report…' />
          </div>
        ) : (
          <>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <SummaryCard
                title='Total expenses'
                value={formatCurrency(summary?.totalAmount ?? 0)}
                description='Created within the selected range'
              />
              <SummaryCard
                title='Paid'
                value={formatCurrency(summary?.paidAmount ?? 0)}
                description='Captured payments'
              />
              <SummaryCard
                title='Outstanding'
                value={formatCurrency(summary?.outstandingAmount ?? 0)}
                description='Awaiting payment'
              />
              <SummaryCard
                title='Overdue'
                value={formatCurrency(summary?.overdueAmount ?? 0)}
                description='Past due balances'
              />
            </div>

            <Card>
              <CardHeader className='flex flex-col gap-1 md:flex-row md:items-center md:justify-between'>
                <div>
                  <CardTitle>Expense trend</CardTitle>
                  <CardDescription>
                    {summary
                      ? `${new Date(summary.startDate).toLocaleDateString()} – ${new Date(summary.endDate).toLocaleDateString()}`
                      : 'No data available'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className='h-[320px] pt-2'>
                {loading ? (
                  <div className='flex h-full items-center justify-center'>
                    <LoadingIndicator label='Loading expense trend…' />
                  </div>
                ) : trend.length === 0 ? (
                  <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>No expenses recorded for the selected period.</div>
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={trend} margin={{ top: 24, right: 24, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id='expenseGradient' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='5%' stopColor='#2563eb' stopOpacity={0.85} />
                          <stop offset='95%' stopColor='#2563eb' stopOpacity={0.08} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray='4 8' vertical={false} />
                      <XAxis dataKey='label' tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tickLine={false} axisLine={false} width={120} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(Number(value))}
                        labelFormatter={(label) => label}
                        contentStyle={{ borderRadius: 12 }}
                      />
                      <Area type='monotone' dataKey='amount' stroke='#2563eb' fill='url(#expenseGradient)' strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-base font-semibold'>Spending by category</CardTitle>
                  <CardDescription>Highest expense categories within the selected period</CardDescription>
                </CardHeader>
                <CardContent className='pt-0'>
                  {categories.length === 0 ? (
                    <div className='text-muted-foreground flex h-40 items-center justify-center text-sm'>No expenses recorded.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className='text-right'>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((row) => (
                          <TableRow key={row.category}>
                            <TableCell>{row.category}</TableCell>
                            <TableCell className='text-right'>{formatCurrency(row.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-base font-semibold'>Recent payments</CardTitle>
                  <CardDescription>Latest expense payments captured</CardDescription>
                </CardHeader>
                <CardContent className='pt-0'>
                  {loading ? (
                    <div className='flex h-40 items-center justify-center'>
                      <LoadingIndicator label='Loading payments…' />
                    </div>
                  ) : payments.length === 0 ? (
                    <div className='text-muted-foreground flex h-40 items-center justify-center text-sm'>No payments recorded.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Expense</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className='text-right'>Amount</TableHead>
                          <TableHead className='text-right'>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className='font-medium'>#{row.expenseId.slice(0, 8)}</TableCell>
                            <TableCell>{row.paymentMethod}</TableCell>
                            <TableCell className='text-right'>{formatCurrency(row.amount)}</TableCell>
                            <TableCell className='text-right'>
                              {row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className='pb-4'>
                <CardTitle className='text-base font-semibold'>Recent expenses</CardTitle>
                <CardDescription>Track bills and outstanding balances</CardDescription>
              </CardHeader>
              <CardContent className='pt-0'>
                {loading ? (
                  <div className='flex h-40 items-center justify-center'>
                    <LoadingIndicator label='Loading expenses…' />
                  </div>
                ) : expenses.length === 0 ? (
                  <div className='text-muted-foreground flex h-40 items-center justify-center text-sm'>No expenses recorded.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className='text-right'>Amount</TableHead>
                        <TableHead className='text-right'>Paid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => {
                        const statusKey = expense.status.toLowerCase()
                        const statusClass = STATUS_COLORS[statusKey] ?? STATUS_COLORS.outstanding
                        const dueDateLabel = expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : '—'
                        return (
                          <TableRow key={expense.id}>
                            <TableCell className='font-medium'>#{expense.id.slice(0, 8)}</TableCell>
                            <TableCell>{expense.category}</TableCell>
                            <TableCell className='text-right'>{formatCurrency(expense.amount)}</TableCell>
                            <TableCell className='text-right'>{formatCurrency(expense.paidAmount)}</TableCell>
                            <TableCell>
                              <Badge className={statusClass}>{expense.status}</Badge>
                            </TableCell>
                            <TableCell>{dueDateLabel}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Main>
    </>
  )
}

