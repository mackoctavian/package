"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Download, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@dashboard/components/confirm-dialog'
import { Header } from '@dashboard/components/layout/header'
import { Main } from '@dashboard/components/layout/main'
import { Search } from '@dashboard/components/search'
import { ThemeSwitch } from '@dashboard/components/theme-switch'
import { ConfigDrawer } from '@dashboard/components/config-drawer'
import { ProfileDropdown } from '@dashboard/components/profile-dropdown'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import {
  useCreateInventoryItem,
  useDeleteInventoryItem,
  useInventoryItems,
  useUpdateInventoryItem,
  type InventoryItem,
  type InventoryItemsResponse,
} from '@dashboard/hooks/use-inventory-items'
import {
  useInventoryCategories,
  type InventoryCategoriesResponse,
} from '@dashboard/hooks/use-inventory-categories'
import {
  useInventoryDepartments,
  type InventoryDepartmentsResponse,
} from '@dashboard/hooks/use-inventory-departments'
import { useSelectedLocationStore } from '@dashboard/store/selected-location'
import { useDebounce } from '@dashboard/hooks/use-debounce'
import {
  getCurrencyConfig,
  formatCurrencyValue,
} from '@dashboard/lib/currency'
import { ItemsFilters, type FilterOption } from './components/items-filters'
import { InventoryItemsTable } from './components/items-table'
import { ItemFormDialog } from './components/item-form-dialog'
import { ItemsImportDialog } from './components/items-import-dialog'

type DialogState = {
  open: boolean
  mode: 'create' | 'edit'
  item: InventoryItem | null
}

export function InventoryItems() {
  const { data: sidebarInfo } = useSidebarInfo()
  const selectedLocationId = useSelectedLocationStore((state) => state.selectedLocationId)

  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'active'
  )
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [bulkDeletePending, setBulkDeletePending] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  useEffect(() => {
    if (locationFilter === '' && selectedLocationId) {
      setLocationFilter(selectedLocationId)
    }
  }, [selectedLocationId, locationFilter])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, categoryFilter, locationFilter])

  const locationIdParam =
    locationFilter === 'all' || locationFilter === '' ? undefined : locationFilter
  const categoryIdParam =
    categoryFilter === 'all' ? undefined : categoryFilter

  const itemsQuery = useInventoryItems({
    search: debouncedSearch || undefined,
    status: statusFilter,
    categoryId: categoryIdParam,
    locationId: locationIdParam,
    page,
    pageSize,
  })

  const categoriesQuery = useInventoryCategories({
    status: 'active',
    locationId: locationIdParam,
    page: 1,
    pageSize: 100,
  })

  const departmentsQuery = useInventoryDepartments({
    status: 'active',
    locationId: locationIdParam,
    page: 1,
    pageSize: 100,
  })

  const categoriesData = useMemo(
    () =>
      (categoriesQuery.data as InventoryCategoriesResponse | undefined)?.data ?? [],
    [categoriesQuery.data]
  )
  const departmentsData = useMemo(
    () =>
      (departmentsQuery.data as InventoryDepartmentsResponse | undefined)?.data ?? [],
    [departmentsQuery.data]
  )
  const itemsData = useMemo(
    () => (itemsQuery.data as InventoryItemsResponse | undefined)?.data ?? [],
    [itemsQuery.data]
  )
  const itemsPagination =
    (itemsQuery.data as InventoryItemsResponse | undefined)?.pagination ?? null

  const locations = useMemo(
    () => sidebarInfo?.locations ?? [],
    [sidebarInfo?.locations]
  )
  const currencyConfig = useMemo(() => getCurrencyConfig(), [])
  const formatPrice = useCallback(
    (value: number) => formatCurrencyValue(value ?? 0, currencyConfig),
    [currencyConfig]
  )

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

  const categoryFilterOptions: FilterOption[] = useMemo(
    () => [
      { value: 'all', label: 'Category · All' },
      ...categoriesData.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categoriesData]
  )

  const categoryFormOptions: FilterOption[] = useMemo(
    () => [
      { value: 'none', label: 'No category' },
      ...categoriesData.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categoriesData]
  )

  const departmentFormOptions: FilterOption[] = useMemo(
    () => [
      { value: 'none', label: 'No department' },
      ...departmentsData.map((department) => ({
        value: department.id,
        label: department.name,
      })),
    ],
    [departmentsData]
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

  const createItem = useCreateInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const deleteItem = useDeleteInventoryItem()

  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: 'create',
    item: null,
  })
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)

  const openCreateDialog = () =>
    setDialogState({ open: true, mode: 'create', item: null })
  const openEditDialog = (item: InventoryItem) =>
    setDialogState({ open: true, mode: 'edit', item })
  const closeDialog = () =>
    setDialogState((state) => ({ ...state, open: false }))

  const handleCreate = async (payload: Parameters<typeof createItem.mutateAsync>[0]) => {
    await createItem.mutateAsync(payload)
    toast.success('Item created')
    closeDialog()
  }

  const handleUpdate = async (
    id: string,
    payload: Parameters<typeof updateItem.mutateAsync>[0]['input']
  ) => {
    await updateItem.mutateAsync({ id, input: payload })
    toast.success('Item updated')
    closeDialog()
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    await deleteItem.mutateAsync(itemToDelete.id)
    toast.success('Item deleted')
    setItemToDelete(null)
  }

  const handleBulkDeleteSelected = async (selected: InventoryItem[]) => {
    if (selected.length === 0) return

    setBulkDeletePending(true)
    try {
      await toast.promise(
        (async () => {
          for (const item of selected) {
            await deleteItem.mutateAsync(item.id)
          }
        })(),
        {
          loading: `Deleting ${selected.length} item${selected.length > 1 ? 's' : ''}…`,
          success: `${selected.length} item${selected.length > 1 ? 's were' : ' was'} deleted`,
          error: 'Failed to delete selected items',
        }
      )
    } finally {
      setBulkDeletePending(false)
    }
  }

  const isMutating =
    createItem.isPending ||
    updateItem.isPending ||
    deleteItem.isPending ||
    bulkDeletePending

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
        <Card>
          <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                Manage your menu items, track stock, and keep pricing aligned across locations.
              </CardDescription>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='gap-2'
                onClick={() => setImportDialogOpen(true)}
                disabled={isMutating}
              >
                <Download className='h-4 w-4' />
                Import
              </Button>
              <Button onClick={openCreateDialog} className='gap-2' disabled={isMutating}>
                <Plus className='h-4 w-4' /> Create item
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            <ItemsFilters
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              statusValue={statusFilter}
              onStatusChange={setStatusFilter}
              categoryValue={categoryFilter}
              onCategoryChange={setCategoryFilter}
              locationValue={locationFilter || (selectedLocationId ?? 'all')}
              onLocationChange={setLocationFilter}
              categoryOptions={categoryFilterOptions}
              locationOptions={locationOptions}
              isLoading={itemsQuery.isLoading}
              onReset={() => {
                setSearchValue('')
                setStatusFilter('active')
                setCategoryFilter('all')
                setLocationFilter(selectedLocationId ?? 'all')
              }}
            />

            <InventoryItemsTable
              items={itemsData}
              isLoading={itemsQuery.isLoading}
              pagination={itemsPagination}
              formatPrice={formatPrice}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onEdit={openEditDialog}
              onDelete={(item) => setItemToDelete(item)}
              disableActions={isMutating}
              onBulkDelete={handleBulkDeleteSelected}
              bulkDeletePending={bulkDeletePending}
            />
          </CardContent>
        </Card>
      </Main>

      <ItemFormDialog
        open={dialogState.open}
        mode={dialogState.mode}
        item={dialogState.item}
        onOpenChange={(open) =>
          setDialogState((state) => ({ ...state, open }))
        }
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        categoryOptions={categoryFormOptions}
        departmentOptions={departmentFormOptions}
        locationOptions={locationFormOptions}
        defaultLocationId={locationIdParam ?? selectedLocationId}
        currencySymbol={currencyConfig.currencySymbol}
        isSubmitting={isMutating}
      />

      <ItemsImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

      <ConfirmDialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null)
        }}
        title='Delete item?'
        desc={`This will remove ${itemToDelete?.name ?? 'the item'} from your catalog.`}
        destructive
        confirmText='Delete'
        handleConfirm={handleDelete}
        isLoading={deleteItem.isPending}
      />
    </>
  )
}
