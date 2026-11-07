export const retreatCategories = [
  { value: 'residential-retreat', label: 'Residential' },
  { value: 'parish-retreat', label: 'Parish' },
  { value: 'special-retreat', label: 'Special' },
  { value: 'jesus-mission-retreat', label: 'Jesus Mission' },
] as const

const legacy: Record<string, string> = {
  residential: 'residential-retreat',
  parish: 'parish-retreat',
  special: 'special-retreat',
  'jesus-mission': 'jesus-mission-retreat',
}

export const normalizeCategory = (value?: string | null) => (value ? legacy[value] ?? value : '')

export const categoryLabel = (value?: string | null) => {
  const normalized = normalizeCategory(value)
  const known = retreatCategories.find((category) => category.value === normalized)
  if (known) return known.label
  return normalized.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

/** Translated label for a category, via the `retreats.categories.*` messages. */
export const translatedCategoryLabel = (t: { maybe: (key: string) => string | undefined }, value?: string | null) =>
  t.maybe(`retreats.categories.${normalizeCategory(value)}`) ?? categoryLabel(value)
