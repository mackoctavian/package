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
  type InventoryItem,
  type InventoryItemsPagination,
} from '@dashboard/hooks/use-inventory-items'
import { createInventoryItemsColumns } from './items-columns'

type InventoryItemsTableProps = {
  items: InventoryItem[]
  isLoading: boolean
  formatPrice: (value: number) => string
  pagination: InventoryItemsPagination | null
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  disableActions?: boolean
  onBulkDelete?: (items: InventoryItem[]) => Promise<void>
  bulkDeletePending?: boolean
}

export function InventoryItemsTable({
  items,
  isLoading,
  formatPrice,
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
}: InventoryItemsTableProps) {
  const columns = useMemo(
    () =>
      createInventoryItemsColumns({
        formatPrice,
        onEdit,
        onDelete,
        actionsDisabled: disableActions,
      }),
    [formatPrice, onDelete, onEdit, disableActions]
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
    data: items,
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
  const selectedItems = selectedRows.map((row) => row.original as InventoryItem)
  const selectedCount = selectedItems.length

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
        await onBulkDelete(selectedItems)
        table.resetRowSelection()
        setShowBulkDeleteDialog(false)
      } catch (error) {
        // Errors are surfaced via the caller (toast, etc.)
        console.error('[inventory-items] Failed to delete selected items', error)
      }
    })()
  }

  const handleBulkDialogOpenChange = (open: boolean) => {
    if (bulkDeletePending) return
    setShowBulkDeleteDialog(open)
  }

  const deleteDescription =
    selectedCount > 1
      ? `This will permanently delete ${selectedCount} selected items. This action cannot be undone.`
      : 'This will permanently delete the selected item. This action cannot be undone.'

  if (isLoading && items.length === 0) {
    return (
      <Card>
        <CardContent className='flex min-h-[260px] items-center justify-center'>
          <LoadingIndicator label='Loading items…' />
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
                        No items found.
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

      <DataTableBulkActions table={table} entityName='item'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              className='size-8'
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={bulkDeletePending}
              aria-label='Delete selected items'
              title='Delete selected items'
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
        title={`Delete ${selectedCount} item${selectedCount === 1 ? '' : 's'}?`}
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

