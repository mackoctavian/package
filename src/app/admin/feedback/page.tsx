import type { Metadata } from 'next'

import { FeedbackTable } from '@/app/components/Admin/FeedbackTable'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Feedback Inbox',
}

export default async function FeedbackAdminPage() {
  await requireAdminPageAccess('feedback')

  return (
    <div className='px-6 py-8'>
      <FeedbackTable />
    </div>
  )
}



