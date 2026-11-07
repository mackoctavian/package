import { redirect } from 'next/navigation'

// Attendance now lives on the live check-in desk.
export default async function RetreatAttendeesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/admin/check-in?retreat=${encodeURIComponent(id)}`)
}
