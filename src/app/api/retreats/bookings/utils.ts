import { RetreatBooking as PrismaRetreatBooking } from '@prisma/client'

import { RetreatBooking } from '@/app/types/retreat-booking'

export const mapPrismaBooking = (row: PrismaRetreatBooking): RetreatBooking => ({
  id: row.id,
  retreatId: row.retreatId,
  retreatTitle: row.retreatTitle,
  fullName: row.fullName,
  email: row.email,
  phone: row.phone,
  whatsapp: row.whatsapp ?? undefined,
  status: (row.status as RetreatBooking['status']) ?? 'pending',
  paymentStatus: (row.paymentStatus as RetreatBooking['paymentStatus']) ?? 'pending',
  attended: row.attended ?? false,
  familyMembers: Array.isArray(row.familyMembers) ? (row.familyMembers as RetreatBooking['familyMembers']) : [],
  notes: row.notes ?? undefined,
  cancelledAt: row.cancelledAt?.toISOString(),
  rescheduledToRetreatId: row.rescheduledToRetreatId ?? undefined,
  rescheduledToRetreatTitle: row.rescheduledToRetreatTitle ?? undefined,
  rescheduledAt: row.rescheduledAt?.toISOString(),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt?.toISOString(),
})

