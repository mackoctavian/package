"use client"

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@dashboard/components/confirm-dialog'
import {
  useCreateInventoryDiscount,
  useDeleteInventoryDiscount,
  useInventoryDiscounts,
  useUpdateInventoryDiscount,
  type InventoryDiscount,
  type InventoryDiscountsResponse,
} from '@dashboard/hooks/use-inventory-discounts'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import { useSelectedLocationStore } from '@dashboard/store/selected-location'
import { useDebounce } from '@dashboard/hooks/use-debounce'
import {
  getCurrencyConfig,
  formatCurrencyValue,
} from '@dashboard/lib/currency'
import { DiscountsFilters } from './components/discounts-filters'
import { DiscountsTable } from './components/discounts-table'
import { DiscountFormDialog } from './components/discount-form-dialog'
import { type FilterOption } from '../items/components/items-filters'
import {
  SUGGESTED_DISCOUNT_TYPES,
  type CreateInventoryDiscountInput,
} from '@dashboard/features/inventory/discounts/schema'

type DialogState = {
  open: boolean
  mode: 'create' | 'edit'
  discount: InventoryDiscount | null
}

const typeOptionBase: FilterOption[] = [{ value: 'all', label: 'Type · All' }]

export function InventoryDiscounts() {
  const { data: sidebarInfo } = useSidebarInfo()
  const selectedLocationId = useSelectedLocationStore((state) => state.selectedLocationId)

  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all'
  )
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    if (locationFilter === '' && selectedLocationId) {
      setLocationFilter(selectedLocationId)
    }
  }, [selectedLocationId, locationFilter])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, typeFilter, locationFilter])

  const locationIdParam =
    locationFilter === 'all' || locationFilter === '' ? undefined : locationFilter
  const typeParam = typeFilter === 'all' ? undefined : typeFilter

  const discountsQuery = useInventoryDiscounts({
    search: debouncedSearch || undefined,
    status: statusFilter,
    type: typeParam,
    locationId: locationIdParam,
    page,
    pageSize,
  })

  const locations = useMemo(
    () => sidebarInfo?.locations ?? [],
    [sidebarInfo?.locations]
  )
  const currencyConfig = useMemo(() => getCurrencyConfig(), [])
  const formatAmount = (value: number | null) =>
    value === null ? '—' : formatCurrencyValue(value, currencyConfig, { minimumFractionDigits: 2 })

  const locationOptions: FilterOption[] = useMemo(
    () => [
      { value: 'all', label: 'Locations · All' },
      ...locations.map((location) => ({
        value: location.id,
        label: location.nickname ?? location.name ?? 'Location',
      })),
    ],
    [locations]
  )

  const locationFormOptions: FilterOption[] = useMemo(
    () => [
      { value: 'none', label: 'All locations' },
      ...locations.map((location) => ({
        value: location.id,
        label: location.nickname ?? location.name ?? 'Location',
      })),
    ],
    [locations]
  )

  const discountsData = useMemo(
    () => (
      (discountsQuery.data as InventoryDiscountsResponse | undefined)?.data ?? []
    ),
    [discountsQuery.data]
  )

  const discountsPagination = (
    discountsQuery.data as InventoryDiscountsResponse | undefined
  )?.pagination ?? null

  const dynamicTypes = useMemo(() => {
    const set = new Set<string>()
    discountsData.forEach((discount) => {
      if (discount.type) set.add(discount.type)
    })
    return Array.from(set)
  }, [discountsData])

  const typeOptions: FilterOption[] = useMemo(() => {
    const suggestions = Array.from(
      new Set<string>([...SUGGESTED_DISCOUNT_TYPES, ...dynamicTypes])
    )
    return [
      ...typeOptionBase,
      ...suggestions.map((type) => ({ value: type, label: type })),
    ]
  }, [dynamicTypes])

  const createDiscount = useCreateInventoryDiscount()
  const updateDiscount = useUpdateInventoryDiscount()
  const deleteDiscount = useDeleteInventoryDiscount()

  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: 'create',
    discount: null,
  })
  const [discountToDelete, setDiscountToDelete] = useState<InventoryDiscount | null>(
    null
  )

  const openCreateDialog = () =>
    setDialogState({ open: true, mode: 'create', discount: null })
  const openEditDialog = (discount: InventoryDiscount) =>
    setDialogState({ open: true, mode: 'edit', discount })
  const closeDialog = () =>
    setDialogState((state) => ({ ...state, open: false }))

  const handleCreate = async (payload: CreateInventoryDiscountInput) => {
    await createDiscount.mutateAsync(payload)
    toast.success('Discount created')
    closeDialog()
  }

  const handleUpdate = async (
    id: string,
    payload: Partial<CreateInventoryDiscountInput>
  ) => {
    await updateDiscount.mutateAsync({ id, input: payload })
    toast.success('Discount updated')
    closeDialog()
  }

  const handleDelete = async () => {
    if (!discountToDelete) return
    await deleteDiscount.mutateAsync(discountToDelete.id)
    toast.success('Discount deleted')
    setDiscountToDelete(null)
  }

  const isMutating =
    createDiscount.isPending ||
    updateDiscount.isPending ||
    deleteDiscount.isPending

  return (
    <div className='flex flex-col gap-6'>
      <Card>
        <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle>Discounts</CardTitle>
            <CardDescription>
              Configure discounts and comps available to your team at checkout.
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} className='gap-2'>
            <Plus className='h-4 w-4' /> Create discount
          </Button>
        </CardHeader>
        <CardContent className='space-y-6'>
          <DiscountsFilters
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            statusValue={statusFilter}
            onStatusChange={setStatusFilter}
            typeValue={typeFilter}
            onTypeChange={setTypeFilter}
            locationValue={locationFilter || (selectedLocationId ?? 'all')}
            onLocationChange={setLocationFilter}
            typeOptions={typeOptions}
            locationOptions={locationOptions}
            isLoading={discountsQuery.isLoading}
            onReset={() => {
              setSearchValue('')
              setStatusFilter('all')
              setTypeFilter('all')
              setLocationFilter(selectedLocationId ?? 'all')
            }}
          />

          <DiscountsTable
            discounts={discountsData}
            isLoading={discountsQuery.isLoading}
            pagination={discountsPagination}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onEdit={openEditDialog}
            onDelete={(discount) => setDiscountToDelete(discount)}
            formatAmount={formatAmount}
            disableActions={isMutating}
          />
        </CardContent>
      </Card>

      <DiscountFormDialog
        open={dialogState.open}
        mode={dialogState.mode}
        discount={dialogState.discount}
        onOpenChange={(open) =>
          setDialogState((state) => ({ ...state, open }))
        }
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        locationOptions={locationFormOptions}
        currencySymbol={currencyConfig.currencySymbol}
        isSubmitting={isMutating}
      />

      <ConfirmDialog
        open={Boolean(discountToDelete)}
        onOpenChange={(open) => {
          if (!open) setDiscountToDelete(null)
        }}
        title='Delete discount?'
        desc={`This will remove ${discountToDelete?.name ?? 'the discount'} and it will no longer be available.`}
        destructive
        confirmText='Delete'
        handleConfirm={handleDelete}
        isLoading={deleteDiscount.isPending}
      />
    </div>
  )
}

