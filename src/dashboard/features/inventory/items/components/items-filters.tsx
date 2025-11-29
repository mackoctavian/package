"use client"

import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type FilterOption = {
  value: string
  label: string
}

type ItemsFiltersProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  statusValue: 'all' | 'active' | 'inactive'
  onStatusChange: (value: 'all' | 'active' | 'inactive') => void
  categoryValue: string
  onCategoryChange: (value: string) => void
  locationValue: string
  onLocationChange: (value: string) => void
  categoryOptions: FilterOption[]
  locationOptions: FilterOption[]
  isLoading?: boolean
  onReset?: () => void
}

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'Status · All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export function ItemsFilters({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  categoryValue,
  onCategoryChange,
  locationValue,
  onLocationChange,
  categoryOptions,
  locationOptions,
  isLoading,
  onReset,
}: ItemsFiltersProps) {
  return (
    <div className='bg-background/80 supports-[backdrop-filter]:bg-background/60 border-border/60 sticky top-[var(--app-header-height,0px)] z-20 flex flex-col gap-3 rounded-lg border p-4 backdrop-blur'>
      <div className='flex flex-wrap items-center gap-2'>
        <Select
          value={categoryValue}
          onValueChange={onCategoryChange}
          disabled={isLoading}
        >
          <SelectTrigger className='h-9 w-[160px] min-w-[160px]'>
            <SelectValue placeholder='Category' />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={locationValue}
          onValueChange={onLocationChange}
          disabled={isLoading}
        >
          <SelectTrigger className='h-9 w-[160px] min-w-[160px]'>
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

        <Select
          value={statusValue}
          onValueChange={(value) => onStatusChange(value as 'all' | 'active' | 'inactive')}
          disabled={isLoading}
        >
          <SelectTrigger className='h-9 w-[150px] min-w-[150px]'>
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

        <Button
          variant='ghost'
          size='sm'
          onClick={onReset}
          disabled={isLoading}
          className='ms-auto me-0 h-9 px-3'
        >
          Reset
        </Button>
      </div>

      <div className='flex items-center gap-3'>
        <div className='relative flex-1 min-w-[220px]'>
          <Search className='text-muted-foreground pointer-events-none absolute left-3 top-2.5 h-4 w-4' />
          <Input
            placeholder='Search items...'
            className='pl-9'
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  )
}

