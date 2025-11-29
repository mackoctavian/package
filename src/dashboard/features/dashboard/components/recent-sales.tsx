import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type DashboardRecentSale } from '@dashboard/hooks/use-dashboard-metrics'

type RecentSalesProps = {
  sales: DashboardRecentSale[]
  formatAmount: (value: number) => string
}

export function RecentSales({ sales, formatAmount }: RecentSalesProps) {
  if (!sales.length) {
    return (
      <div className='text-muted-foreground text-sm'>
        No recent transactions for the selected filters yet.
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {sales.map((sale) => {
        const itemNames = sale.items
          .map((item) => item.name?.trim())
          .filter((name): name is string => Boolean(name && name.length > 0))
        const initials = (itemNames[0]?.slice(0, 2) || 'TX').toUpperCase()
        const combinedItems = itemNames.join(', ') || 'Item'
        const formattedAmount = formatAmount(sale.amount ?? 0)
        const createdDate = new Date(sale.createdAt)
        const formattedDate = createdDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })

        return (
          <div key={sale.id} className='flex items-center gap-4'>
            <Avatar className='h-9 w-9'>
              <AvatarImage src='/avatars/shadcn.jpg' alt={itemNames[0] ?? 'Item'} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className='flex flex-1 flex-wrap items-center justify-between gap-2'>
              <div className='space-y-1'>
                <p className='text-sm font-medium leading-tight'>
                  <span className='line-clamp-1 break-words'>{combinedItems}</span>
                </p>
                <p className='text-muted-foreground text-xs line-clamp-1 break-words'>
                  {formattedDate}
                  {sale.items.length > 1 ? ` • ${sale.items.length} items` : ''}
                </p>
              </div>
              <div className='text-sm font-medium'>{formattedAmount}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

