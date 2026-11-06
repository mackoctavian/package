import { BookOpen, Church, HandHeart, HeartHandshake } from 'lucide-react'

export const givingFunds = [
  { id: 'general', label: 'Where most needed', icon: HeartHandshake, text: 'Lets the centre direct your gift to the greatest need.' },
  { id: 'scholarships', label: 'Retreat scholarships', icon: BookOpen, text: 'Helps youth and families who cannot afford a retreat.' },
  { id: 'outreach', label: 'Mercy outreach', icon: HandHeart, text: 'Supports the poor, the sick and parish missions.' },
  { id: 'chapel', label: 'Chapel & house', icon: Church, text: 'Cares for the chapel, rooms and grounds of DMRC.' },
] as const
