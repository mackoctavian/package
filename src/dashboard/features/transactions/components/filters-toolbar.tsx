"use client"

import { useMemo } from 'react'
import { Calendar as CalendarIcon, FilterIcon, RefreshCwIcon, SearchIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Option = {
  label: string
  value: string
}

export type TransactionsFilterValues = {
  dateRange: DateRange | undefined
  paymentMethod: string
  paymentStatus: string
  location: string
  source: string
  search: string
}

type TransactionsFiltersToolbarProps = {
  values: TransactionsFilterValues
  onDateRangeChange: (range: DateRange | undefined) => void
  onPaymentMethodChange: (value: string) => void
  onPaymentStatusChange: (value: string) => void
  onLocationChange: (value: string) => void
  onSourceChange: (value: string) => void
  onSearchChange: (value: string) => void
  onReset: () => void
  locationOptions: Option[]
  methodOptions: Option[]
  statusOptions: Option[]
  sourceOptions: Option[]
  isLoading?: boolean
}

function formatDateRangeLabel(range: DateRange | undefined) {
  if (!range?.from && !range?.to) {
    return 'All dates'
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (range.from && range.to) {
    return `${formatter.format(range.from)} – ${formatter.format(range.to)}`
  }

  if (range.from) {
    return formatter.format(range.from)
  }

  if (range.to) {
    return formatter.format(range.to)
  }

  return 'All dates'
}

export function TransactionsFiltersToolbar({
  values,
  onDateRangeChange,
  onPaymentMethodChange,
  onPaymentStatusChange,
  onLocationChange,
  onSourceChange,
  onSearchChange,
  onReset,
  locationOptions,
  methodOptions,
  statusOptions,
  sourceOptions,
  isLoading,
}: TransactionsFiltersToolbarProps) {
  const dateLabel = useMemo(() => formatDateRangeLabel(values.dateRange), [values.dateRange])

  return (
    <div className='border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-[var(--app-header-height,0px)] z-20 flex flex-col gap-3 rounded-lg border p-4 backdrop-blur'>
      <div className='flex flex-wrap items-center gap-2'>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='min-w-[180px] justify-start gap-2'
              disabled={isLoading}
            >
              <CalendarIcon className='h-4 w-4' />
              <span className='truncate'>{dateLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              initialFocus
              mode='range'
              numberOfMonths={2}
              selected={values.dateRange}
              onSelect={onDateRangeChange}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={values.paymentMethod}
          onValueChange={onPaymentMethodChange}
          disabled={isLoading}
        >
          <SelectTrigger className='h-9 w-[160px]'>
            <SelectValue placeholder='Payment method' />
          </SelectTrigger>
          <SelectContent>
            {methodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={values.paymentStatus}
          onValueChange={onPaymentStatusChange}
          disabled={isLoading}
        >
          <SelectTrigger className='h-9 w-[160px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={values.location} onValueChange={onLocationChange} disabled={isLoading}>
          <SelectTrigger className='h-9 w-[180px]'>
            <SelectValue placeholder='Location' />
          </SelectTrigger>
          <SelectContent>
            {locationOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={values.source} onValueChange={onSourceChange} disabled={isLoading}>
          <SelectTrigger className='h-9 w-[160px]'>
            <SelectValue placeholder='Source' />
          </SelectTrigger>
          <SelectContent>
            {sourceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant='ghost' size='sm' onClick={onReset} disabled={isLoading}>
          <RefreshCwIcon className='mr-2 h-4 w-4' />
          Reset
        </Button>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='relative flex-1 min-w-[200px]'>
          <SearchIcon className='text-muted-foreground pointer-events-none absolute left-3 top-2.5 h-4 w-4' />
          <Input
            placeholder='Search by reference, item or location...'
            className='pl-9'
            value={values.search}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            disabled={isLoading}
          />
        </div>
        <Button variant='outline' size='sm' className='gap-2'>
          <FilterIcon className='h-4 w-4' />
          Export
        </Button>
      </div>
    </div>
  )
}

