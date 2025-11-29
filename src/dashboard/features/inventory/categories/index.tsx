"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@dashboard/components/confirm-dialog'
import { Header } from '@dashboard/components/layout/header'
import { Main } from '@dashboard/components/layout/main'
import { Search } from '@dashboard/components/search'
import { ThemeSwitch } from '@dashboard/components/theme-switch'
import { ConfigDrawer } from '@dashboard/components/config-drawer'
import { ProfileDropdown } from '@dashboard/components/profile-dropdown'
import {
  useCreateInventoryCategory,
  useDeleteInventoryCategory,
  useInventoryCategories,
  useUpdateInventoryCategory,
  type InventoryCategory,
  type InventoryCategoriesResponse,
} from '@dashboard/hooks/use-inventory-categories'
import { type CreateInventoryCategoryInput } from '@dashboard/features/inventory/categories/schema'
import {
  useInventoryDepartments,
  type InventoryDepartmentsResponse,
} from '@dashboard/hooks/use-inventory-departments'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import { useSelectedLocationStore } from '@dashboard/store/selected-location'
import { useDebounce } from '@dashboard/hooks/use-debounce'
import { CategoriesFilters } from './components/categories-filters'
import { CategoriesTable } from './components/categories-table'
import { CategoryFormDialog } from './components/category-form-dialog'
import { type FilterOption } from '../items/components/items-filters'

type DialogState = {
  open: boolean
  mode: 'create' | 'edit'
  category: InventoryCategory | null
}

export function InventoryCategories() {
  const { data: sidebarInfo } = useSidebarInfo()
  const selectedLocationId = useSelectedLocationStore((state) => state.selectedLocationId)

  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all'
  )
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [bulkDeletePending, setBulkDeletePending] = useState(false)

  useEffect(() => {
    if (locationFilter === '' && selectedLocationId) {
      setLocationFilter(selectedLocationId)
    }
  }, [selectedLocationId, locationFilter])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, departmentFilter, locationFilter])

  const locationIdParam =
    locationFilter === 'all' || locationFilter === '' ? undefined : locationFilter
  const departmentIdParam =
    departmentFilter === 'all' ? undefined : departmentFilter

  const categoriesQuery = useInventoryCategories({
    search: debouncedSearch || undefined,
    status: statusFilter,
    departmentId: departmentIdParam,
    locationId: locationIdParam,
    page,
    pageSize,
  })

  const categoryOptionsQuery = useInventoryCategories({
    status: 'all',
    departmentId: departmentIdParam,
    locationId: locationIdParam,
    page: 1,
    pageSize: 200,
  })

  const departmentsQuery = useInventoryDepartments({
    status: 'active',
    locationId: locationIdParam,
    page: 1,
    pageSize: 200,
  })

  const departmentData = useMemo(
    () =>
      (departmentsQuery.data as InventoryDepartmentsResponse | undefined)?.data ?? [],
    [departmentsQuery.data]
  )
  const categoryOptionsData = useMemo(
    () =>
      (categoryOptionsQuery.data as InventoryCategoriesResponse | undefined)?.data ?? [],
    [categoryOptionsQuery.data]
  )

  const locations = useMemo(
    () => sidebarInfo?.locations ?? [],
    [sidebarInfo?.locations]
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

  const departmentFilterOptions: FilterOption[] = useMemo(
    () => [
      { value: 'all', label: 'Department · All' },
      ...(departmentData.map((department) => ({
        value: department.id,
        label: department.name,
      })) ?? []),
    ],
    [departmentData]
  )

  const departmentFormOptions: FilterOption[] = useMemo(
    () => [
      { value: 'none', label: 'No department' },
      ...(departmentData.map((department) => ({
        value: department.id,
        label: department.name,
      })) ?? []),
    ],
    [departmentData]
  )

  const parentCategoryOptions: FilterOption[] = useMemo(
    () => [
      { value: 'none', label: 'No parent' },
      ...(categoryOptionsData.map((cat) => ({
        value: cat.id,
        label: cat.name,
      })) ?? []),
    ],
    [categoryOptionsData]
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

  const createCategory = useCreateInventoryCategory()
  const updateCategory = useUpdateInventoryCategory()
  const deleteCategory = useDeleteInventoryCategory()

  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: 'create',
    category: null,
  })
  const [categoryToDelete, setCategoryToDelete] = useState<InventoryCategory | null>(
    null
  )

  const openCreateDialog = () =>
    setDialogState({ open: true, mode: 'create', category: null })
  const openEditDialog = (category: InventoryCategory) =>
    setDialogState({ open: true, mode: 'edit', category })
  const closeDialog = () =>
    setDialogState((state) => ({ ...state, open: false }))

  const handleCreate = async (payload: CreateInventoryCategoryInput) => {
    await createCategory.mutateAsync(payload)
    toast.success('Category created')
    closeDialog()
  }

  const handleUpdate = async (
    id: string,
    payload: Partial<CreateInventoryCategoryInput>
  ) => {
    await updateCategory.mutateAsync({ id, input: payload })
    toast.success('Category updated')
    closeDialog()
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    await deleteCategory.mutateAsync(categoryToDelete.id)
    toast.success('Category deleted')
    setCategoryToDelete(null)
  }

  const handleBulkDeleteSelected = async (selected: InventoryCategory[]) => {
    if (selected.length === 0) return

    setBulkDeletePending(true)
    try {
      await toast.promise(
        (async () => {
          for (const category of selected) {
            await deleteCategory.mutateAsync(category.id)
          }
        })(),
        {
          loading: `Deleting ${selected.length} categor${selected.length === 1 ? 'y' : 'ies'}…`,
          success: `${selected.length} categor${selected.length === 1 ? 'y was' : 'ies were'} deleted`,
          error: 'Failed to delete selected categories',
        }
      )
    } finally {
      setBulkDeletePending(false)
    }
  }

  const isMutating =
    createCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending ||
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
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Group items into logical categories to make selling faster for your team.
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} className='gap-2'>
              <Plus className='h-4 w-4' /> Create category
            </Button>
          </CardHeader>
          <CardContent className='space-y-6'>
            <CategoriesFilters
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              statusValue={statusFilter}
              onStatusChange={setStatusFilter}
              departmentValue={departmentFilter}
              onDepartmentChange={setDepartmentFilter}
              locationValue={locationFilter || (selectedLocationId ?? 'all')}
              onLocationChange={setLocationFilter}
              departmentOptions={departmentFilterOptions}
              locationOptions={locationOptions}
              isLoading={categoriesQuery.isLoading}
              onReset={() => {
                setSearchValue('')
                setStatusFilter('all')
                setDepartmentFilter('all')
                setLocationFilter(selectedLocationId ?? 'all')
              }}
            />

            <CategoriesTable
              categories={
                (categoriesQuery.data as InventoryCategoriesResponse | undefined)?.data ?? []
              }
              isLoading={categoriesQuery.isLoading}
              pagination={
                (categoriesQuery.data as InventoryCategoriesResponse | undefined)?.pagination ??
                null
              }
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onEdit={openEditDialog}
              onDelete={(category) => setCategoryToDelete(category)}
              disableActions={isMutating}
              onBulkDelete={handleBulkDeleteSelected}
              bulkDeletePending={bulkDeletePending}
            />
          </CardContent>
        </Card>
      </Main>

      <CategoryFormDialog
        open={dialogState.open}
        mode={dialogState.mode}
        category={dialogState.category}
        onOpenChange={(open) =>
          setDialogState((state) => ({ ...state, open }))
        }
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        categoryOptions={parentCategoryOptions}
        departmentOptions={departmentFormOptions}
        locationOptions={locationFormOptions}
        isSubmitting={isMutating}
      />

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null)
        }}
        title='Delete category?'
        desc={`This will remove ${categoryToDelete?.name ?? 'the category'} from your catalog.`}
        destructive
        confirmText='Delete'
        handleConfirm={handleDelete}
        isLoading={deleteCategory.isPending}
      />
    </>
  )
}
