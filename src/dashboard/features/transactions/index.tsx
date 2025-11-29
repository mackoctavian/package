"use client"

import { useCallback, useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'

import { Header } from '@dashboard/components/layout/header'
import { Main } from '@dashboard/components/layout/main'
import { Search } from '@dashboard/components/search'
import { ThemeSwitch } from '@dashboard/components/theme-switch'
import { ConfigDrawer } from '@dashboard/components/config-drawer'
import { ProfileDropdown } from '@dashboard/components/profile-dropdown'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import { useSelectedLocationStore } from '@dashboard/store/selected-location'
import { useTransactions, type TransactionsResponse } from '@dashboard/hooks/use-transactions'
import { useDebounce } from '@dashboard/hooks/use-debounce'
import { createCurrencyFormatter, getCurrencyConfig } from '@dashboard/lib/currency'
import { TransactionsFiltersToolbar } from './components/filters-toolbar'
import { TransactionsList } from './components/transactions-list'

type LocationOption = {
  value: string
  label: string
}

const paymentMethodOptions = [
  { label: 'All payment methods', value: 'all' },
  { label: 'Card', value: 'card' },
  { label: 'Cash', value: 'cash' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Bank', value: 'bank' },
]

const paymentStatusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Success', value: 'success' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Cancelled', value: 'cancelled' },
]

const sourceOptions = [
  { label: 'All sources', value: 'all' },
  { label: 'POS', value: 'pos' },
  { label: 'Online', value: 'online' },
  { label: 'Mobile', value: 'mobile' },
]

function normalizeDateRange(range: DateRange | undefined) {
  if (!range) return { startDate: undefined, endDate: undefined }

  const startDate = range.from
    ? new Date(Date.UTC(range.from.getFullYear(), range.from.getMonth(), range.from.getDate(), 0, 0, 0))
    : undefined
  const endDate = range.to
    ? new Date(Date.UTC(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 23, 59, 59, 999))
    : undefined

  return {
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
  }
}

function buildLocationOptions(locations: LocationOption[]): LocationOption[] {
  return [{ value: 'all', label: 'All locations' }, ...locations]
}

export function Transactions() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [paymentMethod, setPaymentMethod] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [searchValue, setSearchValue] = useState('')

  const debouncedSearch = useDebounce(searchValue, 300)

  const { data: sidebarInfo } = useSidebarInfo()
  const selectedLocationId = useSelectedLocationStore((state) => state.selectedLocationId)

  const activeLocationId = useMemo(() => {
    if (!sidebarInfo?.locations?.length) return undefined
    if (locationFilter !== 'all') {
      return locationFilter
    }
    if (selectedLocationId) {
      return selectedLocationId
    }
    const defaultLocation = sidebarInfo.locations.find((location) => location.isDefault)
    return defaultLocation?.id ?? sidebarInfo.locations[0]?.id
  }, [sidebarInfo?.locations, locationFilter, selectedLocationId])

  const currencyConfig = useMemo(() => getCurrencyConfig(), [])
  const currencyFormatter = useMemo(() => createCurrencyFormatter(currencyConfig), [currencyConfig])
  const formatCurrency = useCallback(
    (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0),
    [currencyFormatter]
  )

  const filters = useMemo(
    () => {
      const { startDate, endDate } = normalizeDateRange(dateRange)

      const baseFilters = {
        startDate,
        endDate,
        locationId: locationFilter === 'all' ? undefined : locationFilter,
        paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
        paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
        search: debouncedSearch.trim().length ? debouncedSearch.trim() : undefined,
        source: sourceFilter !== 'all' ? sourceFilter : undefined,
      }

      if (!baseFilters.locationId && activeLocationId && locationFilter === 'all') {
        baseFilters.locationId = activeLocationId
      }

      return baseFilters
    },
    [
      dateRange,
      locationFilter,
      paymentMethod,
      paymentStatus,
      debouncedSearch,
      sourceFilter,
      activeLocationId,
    ]
  )

  const transactionsQuery = useTransactions(filters)
  const transactionsData = transactionsQuery.data as TransactionsResponse | undefined
  const transactions = transactionsData?.transactions ?? []
  const totalTransactions = transactionsData?.total ?? transactions.length
  const totalCollected =
    transactionsData?.totalAmount ?? transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  const locationOptions = useMemo(() => {
    const options: LocationOption[] =
      sidebarInfo?.locations?.map((location) => ({
        value: location.id,
        label: location.nickname ?? location.name ?? 'Location',
      })) ?? []
    return buildLocationOptions(options)
  }, [sidebarInfo?.locations])

  const summaryDateLabel = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) {
      return 'All time'
    }
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    if (dateRange.from && dateRange.to) {
      return `${formatter.format(dateRange.from)} – ${formatter.format(dateRange.to)}`
    }
    if (dateRange.from) {
      return formatter.format(dateRange.from)
    }
    if (dateRange.to) {
      return formatter.format(dateRange.to)
    }
    return 'All time'
  }, [dateRange])

  const handleResetFilters = () => {
    setDateRange(undefined)
    setPaymentMethod('all')
    setPaymentStatus('all')
    setLocationFilter('all')
    setSourceFilter('all')
    setSearchValue('')
  }

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
        <div className='space-y-4'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight'>Transactions</h1>
              <p className='text-muted-foreground text-sm'>
                View and filter all processed payments across your locations.
              </p>
            </div>
          </div>

          <TransactionsFiltersToolbar
            values={{
              dateRange,
              paymentMethod,
              paymentStatus,
              location: locationFilter,
              source: sourceFilter,
              search: searchValue,
            }}
            onDateRangeChange={setDateRange}
            onPaymentMethodChange={setPaymentMethod}
            onPaymentStatusChange={setPaymentStatus}
            onLocationChange={setLocationFilter}
            onSourceChange={setSourceFilter}
            onSearchChange={setSearchValue}
            onReset={handleResetFilters}
            locationOptions={locationOptions}
            methodOptions={paymentMethodOptions}
            statusOptions={paymentStatusOptions}
            sourceOptions={sourceOptions}
            isLoading={transactionsQuery.isFetching}
          />
        </div>

        <div className='rounded-lg border bg-card p-6'>
          <div className='flex flex-wrap items-center justify-between gap-4 border-b pb-4'>
            <div>
              <h2 className='text-lg font-semibold'>{summaryDateLabel}</h2>
              <p className='text-muted-foreground text-xs'>
                {totalTransactions.toLocaleString()} complete transactions
              </p>
            </div>
            <div className='text-right'>
              <div className='text-muted-foreground text-xs uppercase tracking-wide'>Total collected</div>
              <div className='text-2xl font-semibold'>
                {formatCurrency(totalCollected)}
              </div>
            </div>
          </div>

          <div className='mt-4'>
            <TransactionsList
              transactions={transactions}
              isLoading={transactionsQuery.isLoading || transactionsQuery.isFetching}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>
      </Main>
    </>
  )
}

