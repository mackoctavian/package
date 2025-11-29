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

import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@dashboard/components/data-table'
import { LoadingIndicator } from '@dashboard/components/data-loading-indicator'
import {
  type InventoryDiscount,
  type InventoryDiscountsPagination,
} from '@dashboard/hooks/use-inventory-discounts'
import { createDiscountColumns } from './discounts-columns'

type DiscountsTableProps = {
  discounts: InventoryDiscount[]
  isLoading: boolean
  pagination: InventoryDiscountsPagination | null
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onEdit: (discount: InventoryDiscount) => void
  onDelete: (discount: InventoryDiscount) => void
  formatAmount: (value: number | null) => string
  disableActions?: boolean
}

export function DiscountsTable({
  discounts,
  isLoading,
  pagination,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  formatAmount,
  disableActions,
}: DiscountsTableProps) {
  const columns = useMemo(
    () =>
      createDiscountColumns({
        formatAmount,
        onEdit,
        onDelete,
        disableActions,
      }),
    [formatAmount, onEdit, onDelete, disableActions]
  )

  const pageCount = pagination?.totalPages ?? 1
  const [sorting, setSorting] = useState<SortingState>([])
  const [paginationState, setPaginationState] = useState<PaginationState>(
    () => ({ pageIndex: Math.max(0, page - 1), pageSize })
  )

  useEffect(() => {
    setPaginationState({ pageIndex: Math.max(0, page - 1), pageSize })
  }, [page, pageSize])

  const table = useReactTable({
    data: discounts,
    columns,
    state: {
      sorting,
      pagination: paginationState,
    },
    onSortingChange: setSorting,
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

  if (isLoading && discounts.length === 0) {
    return (
      <Card>
        <CardContent className='flex min-h-[260px] items-center justify-center'>
          <LoadingIndicator label='Loading discounts…' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className='p-0'>
        <div className='overflow-x-auto'>
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
                    No discounts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} className='border-t' />
      </CardContent>
    </Card>
  )
}

