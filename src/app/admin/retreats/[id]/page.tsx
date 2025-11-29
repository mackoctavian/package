import type { Metadata } from 'next'

import RetreatDetail from '@/app/components/Admin/RetreatDetail'

type PageProps = {
  params: { id: string }
}

export const metadata: Metadata = {
  title: 'Retreat detail | Admin',
}

export default function AdminRetreatDetailPage({ params }: PageProps) {
  return <RetreatDetail retreatId={params.id} />
}
