"use client"

import { useEffect, useMemo, useState } from 'react'
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
  useCreateInventoryDepartment,
  useDeleteInventoryDepartment,
  useInventoryDepartments,
  useUpdateInventoryDepartment,
  type InventoryDepartment,
  type InventoryDepartmentsResponse,
} from '@dashboard/hooks/use-inventory-departments'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import { useSelectedLocationStore } from '@dashboard/store/selected-location'
import { useDebounce } from '@dashboard/hooks/use-debounce'
import { DepartmentsFilters } from './components/departments-filters'
import { DepartmentsTable } from './components/departments-table'
import { DepartmentFormDialog } from './components/department-form-dialog'
import { type FilterOption } from '../items/components/items-filters'
import { type CreateInventoryDepartmentInput } from '@dashboard/features/inventory/departments/schema'

type DialogState = {
  open: boolean
  mode: 'create' | 'edit'
  department: InventoryDepartment | null
}

export function InventoryDepartments() {
  const { data: sidebarInfo } = useSidebarInfo()
  const selectedLocationId = useSelectedLocationStore((state) => state.selectedLocationId)

  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all'
  )
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
  }, [debouncedSearch, statusFilter, locationFilter])

  const locationIdParam =
    locationFilter === 'all' || locationFilter === '' ? undefined : locationFilter

  const departmentsQuery = useInventoryDepartments({
    search: debouncedSearch || undefined,
    status: statusFilter,
    locationId: locationIdParam,
    page,
    pageSize,
  })

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

  const createDepartment = useCreateInventoryDepartment()
  const updateDepartment = useUpdateInventoryDepartment()
  const deleteDepartment = useDeleteInventoryDepartment()

  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: 'create',
    department: null,
  })
  const [departmentToDelete, setDepartmentToDelete] =
    useState<InventoryDepartment | null>(null)

  const openCreateDialog = () =>
    setDialogState({ open: true, mode: 'create', department: null })
  const openEditDialog = (department: InventoryDepartment) =>
    setDialogState({ open: true, mode: 'edit', department })
  const closeDialog = () =>
    setDialogState((state) => ({ ...state, open: false }))

  const handleCreate = async (payload: CreateInventoryDepartmentInput) => {
    await createDepartment.mutateAsync(payload)
    toast.success('Department created')
    closeDialog()
  }

  const handleUpdate = async (
    id: string,
    payload: Partial<CreateInventoryDepartmentInput>
  ) => {
    await updateDepartment.mutateAsync({ id, input: payload })
    toast.success('Department updated')
    closeDialog()
  }

  const handleDelete = async () => {
    if (!departmentToDelete) return
    await deleteDepartment.mutateAsync(departmentToDelete.id)
    toast.success('Department deleted')
    setDepartmentToDelete(null)
  }

  const handleBulkDeleteSelected = async (selected: InventoryDepartment[]) => {
    if (selected.length === 0) return

    setBulkDeletePending(true)
    try {
      await toast.promise(
        (async () => {
          for (const department of selected) {
            await deleteDepartment.mutateAsync(department.id)
          }
        })(),
        {
          loading: `Deleting ${selected.length} department${selected.length === 1 ? '' : 's'}…`,
          success: `${selected.length} department${selected.length === 1 ? '' : 's'} deleted`,
          error: 'Failed to delete selected departments',
        }
      )
    } finally {
      setBulkDeletePending(false)
    }
  }

  const isMutating =
    createDepartment.isPending ||
    updateDepartment.isPending ||
    deleteDepartment.isPending ||
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
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                Use departments to group categories for reporting and permissions.
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} className='gap-2'>
              <Plus className='h-4 w-4' /> Create department
            </Button>
          </CardHeader>
          <CardContent className='space-y-6'>
            <DepartmentsFilters
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              statusValue={statusFilter}
              onStatusChange={setStatusFilter}
              locationValue={locationFilter || (selectedLocationId ?? 'all')}
              onLocationChange={setLocationFilter}
              locationOptions={locationOptions}
              isLoading={departmentsQuery.isLoading}
              onReset={() => {
                setSearchValue('')
                setStatusFilter('all')
                setLocationFilter(selectedLocationId ?? 'all')
              }}
            />

            <DepartmentsTable
              departments={((departmentsQuery.data as InventoryDepartmentsResponse | undefined)?.data ?? []) ?? []}
              isLoading={departmentsQuery.isLoading}
              pagination={((departmentsQuery.data as InventoryDepartmentsResponse | undefined)?.pagination ?? null) ?? null}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onEdit={openEditDialog}
              onDelete={(department) => setDepartmentToDelete(department)}
              disableActions={isMutating}
              onBulkDelete={handleBulkDeleteSelected}
              bulkDeletePending={bulkDeletePending}
            />
          </CardContent>
        </Card>
      </Main>

      <DepartmentFormDialog
        open={dialogState.open}
        mode={dialogState.mode}
        department={dialogState.department}
        onOpenChange={(open) =>
          setDialogState((state) => ({ ...state, open }))
        }
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        locationOptions={locationFormOptions}
        isSubmitting={isMutating}
      />

      <ConfirmDialog
        open={Boolean(departmentToDelete)}
        onOpenChange={(open) => {
          if (!open) setDepartmentToDelete(null)
        }}
        title='Delete department?'
        desc={`This will remove ${departmentToDelete?.name ?? 'the department'} from your catalog.`}
        destructive
        confirmText='Delete'
        handleConfirm={handleDelete}
        isLoading={deleteDepartment.isPending}
      />
    </>
  )
}
