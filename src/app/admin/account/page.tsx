import type { Metadata } from 'next'

import { PageBody, PageHeader, Panel } from '@/app/components/Admin/shell/primitives'
import { Badge } from '@/app/components/ui/badge'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { requireAdminUser } from '@/lib/auth/admin-session'
import { listModuleAccess } from '@/lib/auth/admin-shared'
import { MyLeave } from '@/app/components/Admin/people/MyLeave'
import { AccountForms } from './AccountForms'

export const metadata: Metadata = { title: 'My account' }

export default async function AccountPage() {
  const user = await requireAdminUser()
  const access = listModuleAccess(user)

  return (
    <PageBody>
      <PageHeader title='My account' description={user.email} />
      <MyLeave />
      <AccountForms name={user.name} />
      <Panel title='Your access' description={`${ROLE_LABELS[user.role]}: ${ROLE_DESCRIPTIONS[user.role]}`}>
        <ul className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {access.map((module) => (
            <li key={module.id} className='flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm'>
              <span className='text-navy-950'>{module.label}</span>
              <Badge variant={module.level === 'edit' ? 'default' : 'outline'}>{module.level === 'edit' ? 'Can edit' : 'View only'}</Badge>
            </li>
          ))}
        </ul>
      </Panel>
    </PageBody>
  )
}
