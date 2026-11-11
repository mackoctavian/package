import type { Metadata } from 'next'
import { Suspense } from 'react'

import { TranslationsWorkspace } from '@/app/components/Admin/translations/TranslationsWorkspace'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = { title: 'Translations' }

export default async function Page() {
  await requireAdminPageAccess('translations')
  return (
    <Suspense>
      <TranslationsWorkspace />
    </Suspense>
  )
}
