import { BookOpen, Church, HandHeart, HeartHandshake } from 'lucide-react'

/** Giving funds. Names and descriptions are translated under `giving.funds.<id>`. */
export const givingFunds = [
  { id: 'general', icon: HeartHandshake },
  { id: 'scholarships', icon: BookOpen },
  { id: 'outreach', icon: HandHeart },
  { id: 'chapel', icon: Church },
] as const

/** Customary free-will offering for one Mass, in TZS. */
export const SUGGESTED_OFFERING_PER_MASS = 10000
