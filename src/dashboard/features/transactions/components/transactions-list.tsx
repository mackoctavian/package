"use client"

import { useMemo } from 'react'
import { CalendarIcon, CreditCardIcon, DollarSignIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { type Transaction } from '@dashboard/hooks/use-transactions'
import { LoadingIndicator } from '@dashboard/components/data-loading-indicator'

type TransactionsListProps = {
  transactions: Transaction[]
  isLoading: boolean
  formatCurrency: (value: number) => string
}

type GroupedTransaction = {
  dateLabel: string
  entries: Transaction[]
}

function getMethodIcon(method?: string | null) {
  if (!method) return DollarSignIcon
  const normalized = method.toLowerCase()
  if (normalized.includes('card')) return CreditCardIcon
  if (normalized.includes('cash')) return DollarSignIcon
  return CalendarIcon
}

function groupByDate(transactions: Transaction[]): GroupedTransaction[] {
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const groups = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    const date = new Date(transaction.createdAt)
    const key = formatter.format(date)
    const entries = groups.get(key) ?? []
    entries.push(transaction)
    groups.set(key, entries)
  }

  return Array.from(groups.entries()).map(([dateLabel, entries]) => ({
    dateLabel,
    entries,
  }))
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TransactionsList({ transactions, isLoading, formatCurrency }: TransactionsListProps) {
  const grouped = useMemo(() => groupByDate(transactions), [transactions])

  if (isLoading) {
    return (
      <div className='flex min-h-[280px] items-center justify-center'>
        <LoadingIndicator label='Loading transactions…' />
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <div className='border-border/60 text-muted-foreground rounded-lg border p-8 text-center text-sm'>
        No transactions found for the selected filters.
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {grouped.map((group) => (
        <div key={group.dateLabel} className='space-y-4'>
          <div className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
            {group.dateLabel}
          </div>
          <div className='divide-border rounded-lg border'>
            {group.entries.map((transaction, index) => {
              const createdDate = new Date(transaction.createdAt)
              const Icon = getMethodIcon(transaction.paymentMethod)
              const itemsLabel = transaction.items.length
                ? transaction.items.join(', ')
                : 'No items'

              return (
                <div
                  key={transaction.id}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-4 p-4',
                    index > 0 && 'border-t border-border/70'
                  )}
                >
                  <div className='flex items-start gap-3'>
                    <div className='bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-lg'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <div className='space-y-1'>
                      <div className='text-xs text-muted-foreground'>
                        {formatTime(createdDate)}
                      </div>
                      <div className='text-sm font-medium leading-tight'>
                        <span className='line-clamp-1'>{itemsLabel}</span>
                      </div>
                      <div className='text-muted-foreground text-xs leading-tight'>
                        {transaction.locationName ? `${transaction.locationName} • ` : ''}
                        {transaction.paymentMethod ?? 'Unknown method'}
                        {transaction.source ? ` • ${transaction.source}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className='text-sm font-semibold tabular-nums'>
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

