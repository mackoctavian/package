/**
 * Which admin-managed content can be translated, and which fields.
 *
 * `entity` is what is stored in `content_translations.entity`. Content items
 * (news, publications, gallery, about) share one table, so they share the
 * `content` entity and are told apart by `contentType`.
 *
 * Field kinds:
 *   text  – one line
 *   long  – paragraphs (blank line between paragraphs)
 *   list  – a JSON list of objects; `itemFields` are translated per item
 *
 * A field name starting with `meta.` lives inside the record's `metadata` JSON.
 * This file is shared by the public site, the API and the admin panel.
 */

export type TranslatableField = {
  key: string
  label: string
  kind: 'text' | 'long' | 'list'
  itemFields?: { key: string; label: string; kind: 'text' | 'long' }[]
  hint?: string
}

export type StoredEntity = 'retreat' | 'content' | 'ministry' | 'hero_slide' | 'patron' | 'testimonial'

export type TranslationGroup = {
  /** Id used in admin URLs. */
  id: string
  label: string
  description: string
  entity: StoredEntity
  /** For `content`: the ContentItem `type`. */
  contentType?: string
  /** Admin permission area that may edit these translations. */
  moduleId: 'retreats' | 'news' | 'publications' | 'gallery' | 'about' | 'ministries' | 'homepage' | 'patrons'
  fields: TranslatableField[]
}

export const TRANSLATION_GROUPS: TranslationGroup[] = [
  {
    id: 'retreats',
    label: 'Retreats',
    description: 'Retreat titles, descriptions and practical details.',
    entity: 'retreat',
    moduleId: 'retreats',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle', kind: 'text' },
      { key: 'description', label: 'Description', kind: 'long' },
      { key: 'location', label: 'Location', kind: 'text' },
      { key: 'timeRange', label: 'Times', kind: 'text', hint: 'e.g. “Arrive 2pm, depart after lunch”' },
    ],
  },
  {
    id: 'news',
    label: 'News',
    description: 'News stories and announcements.',
    entity: 'content',
    contentType: 'news',
    moduleId: 'news',
    fields: [
      { key: 'title', label: 'Headline', kind: 'text' },
      { key: 'summary', label: 'Summary', kind: 'long' },
      { key: 'body', label: 'Story', kind: 'long' },
      { key: 'meta.featuredQuote', label: 'Featured quote', kind: 'text' },
      { key: 'meta.featuredScripture', label: 'Featured scripture', kind: 'text' },
    ],
  },
  {
    id: 'publications',
    label: 'Publications',
    description: 'Books, CDs and other items in the bookshop.',
    entity: 'content',
    contentType: 'publications',
    moduleId: 'publications',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'summary', label: 'Subtitle', kind: 'text' },
      { key: 'body', label: 'Description', kind: 'long' },
      { key: 'meta.badge', label: 'Badge', kind: 'text', hint: 'Short label such as “New”' },
    ],
  },
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'Photo, video and audio titles and captions.',
    entity: 'content',
    contentType: 'gallery',
    moduleId: 'gallery',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'summary', label: 'Description', kind: 'long' },
      { key: 'category', label: 'Album / caption', kind: 'text' },
    ],
  },
  {
    id: 'about',
    label: 'About page',
    description: 'History, mission and leadership texts.',
    entity: 'content',
    contentType: 'about',
    moduleId: 'about',
    fields: [
      { key: 'summary', label: 'Role / summary', kind: 'text' },
      { key: 'body', label: 'Text', kind: 'long' },
    ],
  },
  {
    id: 'ministries',
    label: 'Ministries',
    description: 'Ministry pages, focus areas and gatherings.',
    entity: 'ministry',
    moduleId: 'ministries',
    fields: [
      { key: 'title', label: 'Name', kind: 'text' },
      { key: 'shortDescription', label: 'Short description', kind: 'long' },
      { key: 'overview', label: 'Overview', kind: 'long' },
      { key: 'highlightScripture', label: 'Scripture', kind: 'text' },
      {
        key: 'focusAreas',
        label: 'Focus areas',
        kind: 'list',
        itemFields: [
          { key: 'title', label: 'Title', kind: 'text' },
          { key: 'description', label: 'Description', kind: 'long' },
        ],
      },
      {
        key: 'gatherings',
        label: 'Gatherings',
        kind: 'list',
        itemFields: [
          { key: 'day', label: 'Day', kind: 'text' },
          { key: 'time', label: 'Time', kind: 'text' },
          { key: 'description', label: 'Description', kind: 'long' },
        ],
      },
    ],
  },
  {
    id: 'hero-slides',
    label: 'Homepage slides',
    description: 'Headline, text and button on each homepage slide.',
    entity: 'hero_slide',
    moduleId: 'homepage',
    fields: [
      { key: 'title', label: 'Headline', kind: 'text' },
      { key: 'subtitle', label: 'Text', kind: 'long' },
      { key: 'linkText', label: 'Button text', kind: 'text' },
    ],
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    description: 'Testimonies shown on the homepage.',
    entity: 'testimonial',
    moduleId: 'homepage',
    fields: [
      { key: 'quote', label: 'Testimony', kind: 'long' },
      { key: 'role', label: 'Description of the person', kind: 'text' },
    ],
  },
  {
    id: 'patrons',
    label: 'Patrons',
    description: 'Titles and descriptions of patrons and clergy.',
    entity: 'patron',
    moduleId: 'patrons',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'role', label: 'Role', kind: 'text' },
      { key: 'bio', label: 'Biography', kind: 'long' },
    ],
  },
]

export const findTranslationGroup = (id: string) => TRANSLATION_GROUPS.find((group) => group.id === id)

export const fieldsForEntity = (entity: StoredEntity) => {
  const seen = new Map<string, TranslatableField>()
  for (const group of TRANSLATION_GROUPS) {
    if (group.entity !== entity) continue
    for (const field of group.fields) seen.set(field.key, field)
  }
  return seen
}
