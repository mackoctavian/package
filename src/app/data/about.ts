/**
 * Bundled About page content. The wording (in English and Swahili) lives in
 * `src/i18n/messages/about.ts`; admins can override the story, mission and
 * leadership from Admin → About (content items with metadata.section set to
 * "history", "mission" or "leadership") and translate them in Admin →
 * Translations.
 */

export type Leader = { id?: string; name: string; role: string; body: string; image?: string }

/** Year/event pairs; the event text is looked up under `about.story.milestones.<id>`. */
export const storyMilestones = ['m2010', 'm2016', 'today'] as const
export const pillars = ['encounter', 'healing', 'mission'] as const
export const emblemElements = ['rays', 'heart'] as const

export const congregation = {
  stats: [
    { id: 'founded', value: '1904' },
    { id: 'provinces', value: '8' },
    { id: 'members', value: '1,200+' },
  ],
  milestones: [
    { id: 'm1904', year: '1904' },
    { id: 'm1927', year: '1927' },
    { id: 'm1968', year: '1968' },
    { id: 'm1995', year: '1995' },
    { id: 'm2010', year: '2010' },
  ],
  objectives: ['evangelise', 'educate', 'retreats'],
  structure: ['marymatha', 'sacredHeart'],
} as const

/** Default leaders; roles and descriptions are translated under `about.leadership.<id>`. */
export const leaders: (Leader & { id: string })[] = [
  { id: 'director', name: 'Rev. Fr. Christo Thekkanath VC', role: 'Director, DMRC Vikindu', body: 'Leading DMRC with pastoral vision.' },
  { id: 'regional', name: 'Very Rev. Fr. Xavier Khan Vattayil VC', role: 'Regional Superior, Sacred Heart Region', body: 'Shepherding the Vincentian mission in East Africa.' },
  { id: 'provincial', name: 'Very Rev. Fr. Sebastian Thekkanath VC', role: 'Provincial Superior, Marymatha Province', body: 'Guiding Marymatha Province.' },
  { id: 'general', name: 'Very Rev. Fr. Varghese Gnalian VC', role: 'Superior General', body: 'Leading the worldwide Congregation.' },
]
