"use client"

import { useEffect, useMemo, useState } from 'react'
import {
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DataTableBulkActions,
  DataTablePagination,
} from '@dashboard/components/data-table'
import { ConfirmDialog } from '@dashboard/components/confirm-dialog'
import { LoadingIndicator } from '@dashboard/components/data-loading-indicator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  type InventoryDepartment,
  type InventoryDepartmentsPagination,
} from '@dashboard/hooks/use-inventory-departments'
import { createDepartmentColumns } from './departments-columns'

type DepartmentsTableProps = {
  departments: InventoryDepartment[]
  isLoading: boolean
  pagination: InventoryDepartmentsPagination | null
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onEdit: (department: InventoryDepartment) => void
  onDelete: (department: InventoryDepartment) => void
  disableActions?: boolean
  onBulkDelete?: (departments: InventoryDepartment[]) => Promise<void>
  bulkDeletePending?: boolean
}

export function DepartmentsTable({
  departments,
  isLoading,
  pagination,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  disableActions,
  onBulkDelete,
  bulkDeletePending = false,
}: DepartmentsTableProps) {
  const columns = useMemo(
    () =>
      createDepartmentColumns({
        onEdit,
        onDelete,
        disableActions,
      }),
    [onEdit, onDelete, disableActions]
  )

  const pageCount = pagination?.totalPages ?? 1
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [paginationState, setPaginationState] = useState<PaginationState>(
    () => ({ pageIndex: Math.max(0, page - 1), pageSize })
  )

  useEffect(() => {
    setPaginationState({ pageIndex: Math.max(0, page - 1), pageSize })
  }, [page, pageSize])

  const table = useReactTable({
    data: departments,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination: paginationState,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(paginationState) : updater
      if (next.pageIndex !== paginationState.pageIndex) {
        onPageChange(next.pageIndex + 1)
      }
      if (next.pageSize !== paginationState.pageSize) {
        onPageSizeChange(next.pageSize)
      }
      setPaginationState(next)
    },
    manualPagination: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedDepartments = selectedRows.map((row) => row.original as InventoryDepartment)
  const selectedCount = selectedDepartments.length

  useEffect(() => {
    if (selectedCount === 0 && showBulkDeleteDialog && !bulkDeletePending) {
      setShowBulkDeleteDialog(false)
    }
  }, [selectedCount, showBulkDeleteDialog, bulkDeletePending])

  const handleBulkDeleteConfirm = () => {
    if (!onBulkDelete || selectedCount === 0) {
      return
    }

    void (async () => {
      try {
        await onBulkDelete(selectedDepartments)
        table.resetRowSelection()
        setShowBulkDeleteDialog(false)
      } catch (error) {
        console.error('[inventory-departments] Failed to delete selected departments', error)
      }
    })()
  }

  const handleBulkDialogOpenChange = (open: boolean) => {
    if (bulkDeletePending) return
    setShowBulkDeleteDialog(open)
  }

  const deleteDescription =
    selectedCount > 1
      ? `This will permanently delete ${selectedCount} selected departments. This action cannot be undone.`
      : 'This will permanently delete the selected department. This action cannot be undone.'

  if (isLoading && departments.length === 0) {
    return (
      <Card>
        <CardContent className='flex min-h-[260px] items-center justify-center'>
          <LoadingIndicator label='Loading departments…' />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className='max-sm:has-[div[role="toolbar"]]:pb-10 flex h-full flex-col'>
        <CardContent className='flex flex-1 flex-col p-0'>
          <div className='flex h-full flex-col gap-4'>
            <div className='flex-1 overflow-x-auto'>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const meta = header.column.columnDef.meta as
                          | { className?: string }
                          | undefined
                        return (
                          <TableHead key={header.id} className={meta?.className}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map((cell) => {
                          const meta = cell.column.columnDef.meta as
                            | { tdClassName?: string }
                            | undefined
                          return (
                            <TableCell key={cell.id} className={meta?.tdClassName}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className='text-muted-foreground h-24 text-center text-sm'
                      >
                        No departments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <DataTablePagination table={table} className='border-t pt-4 mt-auto' />
          </div>
        </CardContent>
      </Card>

      <DataTableBulkActions table={table} entityName='department'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              className='size-8'
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={bulkDeletePending}
              aria-label='Delete selected departments'
              title='Delete selected departments'
            >
              <Trash2 className='size-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected</p>
          </TooltipContent>
        </Tooltip>
      </DataTableBulkActions>

      <ConfirmDialog
        open={showBulkDeleteDialog}
        onOpenChange={handleBulkDialogOpenChange}
        title={`Delete ${selectedCount} department${selectedCount === 1 ? '' : 's'}?`}
        desc={deleteDescription}
        destructive
        confirmText='Delete'
        handleConfirm={handleBulkDeleteConfirm}
        isLoading={bulkDeletePending}
        disabled={bulkDeletePending}
      />
    </>
  )
}

