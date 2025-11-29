import { ClipboardList, Shield, UserCheck, Users } from 'lucide-react'

import { type TeamMemberStatus } from './schema'

export const statusVariants = new Map<TeamMemberStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
])

export const teamMemberRoles = [
  {
    label: 'Administrator',
    value: 'administrator',
    icon: Shield,
  },
  {
    label: 'Manager',
    value: 'manager',
    icon: Users,
  },
  {
    label: 'Cashier',
    value: 'cashier',
    icon: UserCheck,
  },
  {
    label: 'Support Staff',
    value: 'support',
    icon: ClipboardList,
  },
] as const
