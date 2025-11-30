export type MinistryFocusArea = {
  title: string
  description: string
}

export type MinistryGathering = {
  day: string
  time: string
  description: string
}

export type MinistryContact = {
  coordinator: string
  email: string
  phone?: string
}

export type MinistryActivity = {
  id: string
  title: string
  description: string
  image: string
  date?: string
}

export type MinistryType = {
  id: string
  slug: string
  title: string
  shortDescription: string
  overview: string
  heroImage: string
  highlightScripture?: string
  focusAreas?: MinistryFocusArea[]
  gatherings?: MinistryGathering[]
  contact?: MinistryContact
  activities?: MinistryActivity[]
  order?: number
  isActive?: boolean
}
