import type { Metadata } from 'next'

import RetreatDashboard from '@/app/components/Admin/RetreatDashboard'

export const metadata: Metadata = {
  title: 'Retreats | Admin',
}

export default function AdminRetreatsPage() {
  return <RetreatDashboard />
}

