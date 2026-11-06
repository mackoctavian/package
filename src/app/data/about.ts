/**
 * Bundled About page content. Admins can override the DMRC story, mission and
 * leadership from Admin → About (content items with metadata.section set to
 * "history", "mission" or "leadership").
 */

export type Leader = { name: string; role: string; body: string; image?: string }

export const dmrcStory = {
  history:
    'Divine Mercy Retreat Center (DMRC) Vikindu stands as a beacon of spiritual renewal in East Africa. Established in 2010 by the Vincentian Congregation, the centre has grown into one of the most vibrant retreat houses in Tanzania, welcoming parishes, families, young people and religious for preached retreats, healing services and the sacraments.',
  mission:
    'To proclaim the merciful love of Jesus through retreats, the sacraments and works of mercy, so that every person who comes to Vikindu may encounter Christ, be healed and be sent out as a witness of mercy.',
  milestones: [
    { year: '2010', event: 'DMRC Vikindu inaugurated by the Vincentian Congregation' },
    { year: '2016', event: 'Retreat accommodation expanded' },
    { year: 'Today', event: 'Weekly services, residential and parish retreats all year round' },
  ],
}

export const pillars = [
  { title: 'Encounter', text: 'Preached retreats, adoration and the Word of God open hearts to meet Jesus personally.' },
  { title: 'Healing', text: 'Confession, counselling and prayer ministry bring the mercy of Christ to wounded hearts.' },
  { title: 'Mission', text: 'Renewed people return to their families and parishes as witnesses of mercy.' },
]

export const emblem = {
  description: 'The DMRC emblem expresses our identity: rays of Divine Mercy flowing from the Heart of Jesus over all who come to Him.',
  elements: [
    { name: 'Divine Mercy rays', meaning: 'Grace and mercy flowing from Christ' },
    { name: 'Sacred Heart', meaning: 'The compassionate love of Jesus' },
  ],
}

export const congregation = {
  name: 'Vincentian Congregation',
  history:
    'The Vincentian Congregation (VC) is a religious congregation of men founded in 1904 at Thottakom, Kerala, India. It traces its spiritual lineage to St. Vincent de Paul, the great apostle of charity. What began as a small community of priests has grown into a family serving the Church across continents through retreat ministry, education, healthcare and works of mercy.',
  charism:
    'The Vincentian Congregation is called to follow Christ the Evangeliser of the Poor, proclaiming the Gospel through works of mercy, education and spiritual formation.',
  stats: [
    { value: '1904', label: 'Founded' },
    { value: '8', label: 'Provinces' },
    { value: '1,200+', label: 'Members' },
  ],
  milestones: [
    { year: '1904', event: 'Foundation at Thottakom, Kerala' },
    { year: '1927', event: 'First mission outside Kerala' },
    { year: '1968', event: 'International expansion begins' },
    { year: '1995', event: 'East African mission established' },
    { year: '2010', event: 'DMRC Vikindu inaugurated' },
  ],
  objectives: ['To evangelise the poor and marginalised', 'To provide quality education', 'To establish and serve retreat centres'],
  structure: [
    { name: 'Marymatha Province', text: 'A province of the Congregation dedicated to evangelisation, education and charitable works.' },
    { name: 'Sacred Heart Region, East Africa', text: 'The Vincentian presence in Tanzania and neighbouring nations, to which DMRC belongs.' },
  ],
}

export const leaders: Leader[] = [
  { name: 'Rev. Fr. Christo Thekkanath VC', role: 'Director, DMRC Vikindu', body: 'Leading DMRC with pastoral vision.' },
  { name: 'Very Rev. Fr. Xavier Khan Vattayil VC', role: 'Regional Superior, Sacred Heart Region', body: 'Shepherding the Vincentian mission in East Africa.' },
  { name: 'Very Rev. Fr. Sebastian Thekkanath VC', role: 'Provincial Superior, Marymatha Province', body: 'Guiding Marymatha Province.' },
  { name: 'Very Rev. Fr. Varghese Gnalian VC', role: 'Superior General', body: 'Leading the worldwide Congregation.' },
]
