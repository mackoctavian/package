'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingIndicator } from '@dashboard/components/data-loading-indicator'
import { useSubscriptionPlans } from '@dashboard/hooks/use-subscription-plans'
import { ContentSection } from '../components/content-section'

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

function formatDaysRemaining(value: number) {
  if (value === 0) return 'Expires today'
  if (value > 0) return `${value} day${value === 1 ? '' : 's'} remaining`
  const overdue = Math.abs(value)
  return `${overdue} day${overdue === 1 ? '' : 's'} overdue`
}

export function SettingsSubscription() {
  const { data, isLoading, isError, error } = useSubscriptionPlans()

  return (
    <ContentSection
      title='Subscription'
      desc='Review the current subscription plan and renewal date for each of your locations.'
    >
      {isLoading ? (
        <div className='flex min-h-[240px] items-center justify-center rounded-lg border'>
          <LoadingIndicator label='Loading subscription details…' />
        </div>
      ) : isError ? (
        <div className='text-destructive rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm'>
          Failed to load subscription information: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      ) : !data || data.locations.length === 0 ? (
        <div className='text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm'>
          You have not added any locations yet. Create a location to view subscription details.
        </div>
      ) : (
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Renews on</TableHead>
                <TableHead className='text-right'>Time left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='font-medium leading-tight'>{location.nickname || location.name}</span>
                      <span className='text-muted-foreground text-xs leading-tight'>{location.businessName}</span>
                      {location.isDefault ? (
                        <span className='mt-1 text-xs text-primary'>Primary location</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        location.displayStatus === 'Active'
                          ? 'default'
                          : location.displayStatus === 'Trial'
                            ? 'secondary'
                            : location.displayStatus === 'Grace Period'
                              ? 'outline'
                              : 'destructive'
                      }
                    >
                      {location.displayStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {location.isLocked ? (
                      <Badge variant='destructive'>Locked</Badge>
                    ) : (
                      <Badge variant='outline'>Accessible</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(location.expiresAt)}</TableCell>
                  <TableCell className='text-right'>{formatDaysRemaining(location.daysRemaining)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ContentSection>
  )
}
