import { MinistryType } from '@/app/types/ministry'

export const ministriesData: MinistryType[] = [
  {
    id: 'ministry-001',
    slug: 'healing-deliverance',
    title: 'Healing & Deliverance Ministry',
    shortDescription:
      'Intercession teams and priests minister the mercy of Jesus through adoration, confession, and healing prayers every week.',
    overview:
      'The Healing & Deliverance Ministry walks with individuals and families who are seeking freedom in Christ. Each gathering includes Eucharistic adoration, scripture proclamation, testimony, and personal prayer ministry led by trained intercessors and clergy. Teams also conduct outreach visits for the sick and homebound who cannot travel to the center.',
    heroImage: '/images/courses/coursesOne.svg',
    highlightScripture: '“I will restore you to health and heal your wounds.” — Jeremiah 30:17',
    focusAreas: [
      {
        title: 'Eucharistic Adoration',
        description: 'Guided evenings before the Blessed Sacrament with scripture reflections and praise and worship.',
      },
      {
        title: 'Inner Healing Retreats',
        description: 'Monthly half-day sessions focused on forgiveness, reconciliation, and emotional healing.',
      },
      {
        title: 'Home Visits',
        description: 'Volunteer teams bring intercession, holy communion, and encouragement to the sick and elderly.',
      },
    ],
    gatherings: [
      { day: 'Tuesdays', time: '7:00 PM – 9:00 PM', description: 'Open healing service with confession available.' },
      { day: 'First Saturdays', time: '3:00 PM – 7:00 PM', description: 'Inner healing retreat and adoration night.' },
    ],
    contact: {
      coordinator: 'Sr. Maria Benedicta',
      email: 'healing@dmrc.org',
      phone: '+91 9895 555 210',
    },
  },
  {
    id: 'ministry-002',
    slug: 'youth-discipleship',
    title: 'Youth Discipleship Collective',
    shortDescription:
      'Forming missionary disciples through leadership mentoring, media evangelization, and peer-to-peer small groups.',
    overview:
      'The Youth Discipleship Collective empowers teens and young adults to lead worship, witness boldly, and serve their parishes. Core teams meet weekly for discipleship formation, while outreach squads support diocesan events, street missions, and digital evangelization projects.',
    heroImage: '/images/courses/coursesTwo.svg',
    highlightScripture: '“Let no one look down on you because you are young.” — 1 Timothy 4:12',
    focusAreas: [
      {
        title: 'Leadership Tracks',
        description: 'Mentorship cohorts focusing on prayer, mission identity, and practical ministry skills.',
      },
      {
        title: 'Media Lab',
        description: 'Content creators produce testimonies, reels, and podcasts sharing mercy encounters.',
      },
      {
        title: 'Mission Teams',
        description: 'Youth squads accompany parish missions, street evangelization, and campus outreach.',
      },
    ],
    gatherings: [
      { day: 'Fridays', time: '6:30 PM – 9:00 PM', description: 'Discipleship night with worship, teaching, and small groups.' },
      { day: 'Second Sundays', time: '2:00 PM – 5:00 PM', description: 'Mission planning lab and media workshop.' },
    ],
    contact: {
      coordinator: 'Fr. Christo Thekkanath',
      email: 'youth@dmrc.org',
      phone: '+91 9447 321 488',
    },
  },
  {
    id: 'ministry-003',
    slug: 'family-renewal',
    title: 'Family Renewal Mission',
    shortDescription:
      'Accompanying couples and parents through covenant renewal retreats, counseling, and intercessory support.',
    overview:
      'The Family Renewal Mission journeys with households pursuing deeper unity in Christ. Weekend covenant renewals, parenting workshops, and intercessory support help families rebuild trust, joy, and missionary zeal. Teams connect families with Sacramental resources and counselor referrals when needed.',
    heroImage: '/images/courses/coursesThree.svg',
    highlightScripture: '“As for me and my house, we will serve the Lord.” — Joshua 24:15',
    focusAreas: [
      {
        title: 'Covenant Weekends',
        description: 'Married couples encounter healing, intercession, and renewed vows in the Holy Spirit.',
      },
      {
        title: 'Parenting Labs',
        description: 'Facilitated discussions with practical tools for Catholic family culture and prayer rhythms.',
      },
      {
        title: 'Family Intercession',
        description: 'Weekly rosaries and prayer chains covering urgent family intentions submitted to the center.',
      },
    ],
    gatherings: [
      { day: 'Third Saturdays', time: '9:30 AM – 4:00 PM', description: 'Family formation day with children tracks provided.' },
      { day: 'Wednesdays', time: '8:00 PM – 8:45 PM', description: 'Online rosary and intercession for families in crisis.' },
    ],
    contact: {
      coordinator: 'Fr. Binoy PDM',
      email: 'family@dmrc.org',
    },
  },
  {
    id: 'ministry-004',
    slug: 'mercy-media',
    title: 'Mercy Media & Evangelization',
    shortDescription:
      'Storytelling teams capture testimonies, produce livestreams, and equip parishes to share the mercy message online.',
    overview:
      'Mercy Media & Evangelization serves the digital mission of DMRC. From livestreaming adoration to designing formation series, teams amplify the Gospel beyond the retreat center. Volunteers receive training in storytelling, production, and digital discipleship best practices.',
    heroImage: '/images/courses/coursesFour.svg',
    focusAreas: [
      {
        title: 'Livestream Production',
        description: 'Broadcast weekend adoration, worship nights, and conferences to global audiences.',
      },
      {
        title: 'Testimony Studios',
        description: 'Capture stories of mercy encounters to inspire faith and invite deeper conversion.',
      },
      {
        title: 'Digital Mission Training',
        description: 'Workshops that help parishes and ministries launch evangelization content strategies.',
      },
    ],
    gatherings: [
      { day: 'Thursdays', time: '7:30 PM – 9:30 PM', description: 'Production planning and skills lab.' },
      { day: 'Event Weekends', time: 'As scheduled', description: 'On-site media teams support major events and retreats.' },
    ],
    contact: {
      coordinator: 'Media Ministry Team',
      email: 'media@dmrc.org',
    },
  },
]

