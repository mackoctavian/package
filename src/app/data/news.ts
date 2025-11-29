import { EventHighlight, NewsItem, PressMention } from '@/app/types/news'

export const newsItems: NewsItem[] = [
  {
    id: 'news-001',
    slug: 'dmrc-adoration-chapel-dedication',
    title: 'New Adoration Chapel Dedicated at DMRC',
    summary:
      'Bishop Thomas blessed the renovated adoration chapel, now open daily for pilgrims seeking a place of mercy and intercession.',
    publishedOn: '2025-02-08',
    author: 'DMRC Communications',
    heroImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80',
    tag: 'Announcement',
    readingTime: '4 min read',
    featuredQuote:
      '“This chapel will be a lighthouse of mercy where weary souls encounter the Heart of Jesus,” Bishop Thomas shared during the dedication.',
    content: [
      {
        paragraphs: [
          'Hundreds of pilgrims gathered as Bishop Thomas officially blessed the newly renovated adoration chapel at Divine Mercy Retreat Center. The sanctuary now features an expanded altar of repose, handcrafted icons of the Divine Mercy image, and a dedicated reconciliation room for the sacrament of confession.',
          'The renovation project was made possible through the generosity of benefactors and volunteers who dedicated months to prayer, planning, and service. The chapel will remain open daily from 7:00 AM to 10:00 PM, offering a home of intercession for visitors and retreatants.',
        ],
      },
      {
        heading: 'A Home for Continuous Intercession',
        paragraphs: [
          'Intercessory teams have already scheduled extended vigils for vocations, missionary outreach, and healing of families. Mercy Media will livestream evening holy hours each Thursday so pilgrims across the world can pray in unity.',
          'The center also introduced a new “Adorers of Mercy” rota where participants commit to one hour per week before the Blessed Sacrament. Training for adorers includes formation on lectio divina, silence, and offering intercession for the Church.',
        ],
      },
      {
        heading: 'How You Can Participate',
        paragraphs: [
          'To join the Adorers of Mercy rota or to submit prayer intentions for the chapel, contact the DMRC office at chapel@dmrc.org. Visitors are invited to sign the guest book and share testimonies of how the Lord is moving through this sacred space.',
        ],
      },
    ],
  },
  {
    id: 'news-002',
    slug: 'families-receive-healing-at-renewal-weekend',
    title: 'Families Encounter Healing at Renewal Weekend',
    summary:
      'Over 120 families joined us for the Family Renewal Mission, sharing testimonies of reconciliation and new beginnings.',
    publishedOn: '2025-01-24',
    author: 'Family Renewal Mission Team',
    heroImage: 'https://images.unsplash.com/photo-1530023367847-a683933f4177?auto=format&fit=crop&w=1600&q=80',
    tag: 'Testimony',
    readingTime: '6 min read',
    featuredQuote:
      '"Our children experienced forgiveness, and we found the courage to pray again together as a family," shared Anju and Mathew, retreat participants.',
    content: [
      {
        paragraphs: [
          'The Family Renewal Mission welcomed over 120 families for a two-day encounter focused on healing, reconciliation, and missionary identity. Guided by the DMRC pastoral team, participants journeyed through teaching sessions, testimonies, and times of personal ministry.',
          'Children and teens participated in parallel tracks facilitated by youth missionaries, allowing parents to receive prayer and counsel. Many families testified to restoration in communication and renewed confidence in leading prayer at home.',
        ],
      },
      {
        heading: 'Sacraments at the Center',
        paragraphs: [
          'The weekend included extended Eucharistic adoration, confession times, and a special Mass to renew family covenants. Priests prayed over each household, blessing them to be domestic churches rooted in mercy.',
        ],
      },
      {
        heading: 'Ongoing Support',
        paragraphs: [
          'Graduates of the Family Renewal Mission are invited to monthly follow-up sessions hosted online and on-site. Past participants form small communities that meet for intercession, parenting workshops, and acts of mercy in their parishes.',
        ],
      },
    ],
  },
  {
    id: 'news-003',
    slug: 'mercy-night-vigil-february',
    title: 'February Mercy Night Vigil Announced',
    summary:
      'Join intercessors, worship teams, and priests for a night of Eucharistic adoration, sacramental ministry, and testimonies.',
    publishedOn: '2025-02-01',
    author: 'Mercy Media & Evangelization',
    heroImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1600&q=80',
    tag: 'Event',
    readingTime: '3 min read',
    content: [
      {
        paragraphs: [
          'DMRC intercession teams are preparing for the February Mercy Night Vigil, an evening dedicated to Eucharistic adoration, praise, and healing ministry. Worship will be led by the Mercy Music Collective, and priests will be available throughout the night for confession and pastoral counsel.',
        ],
      },
      {
        heading: 'Encounter Mercy Through Worship',
        paragraphs: [
          'The vigil begins with a candlelight procession of the Divine Mercy image, followed by testimonies of healing from previous participants. Missionaries will lead intercession for the sick, families, and the nations.',
        ],
      },
      {
        heading: 'Join In-Person or Online',
        paragraphs: [
          'Doors open at 7:30 PM and the vigil concludes with Benediction at midnight. For those unable to attend in person, the event will be streamed live on the DMRC YouTube channel. Prayer requests can be submitted beforehand via mercyprayer@dmrc.org.',
        ],
      },
    ],
    featuredScripture: '“Let us then with confidence draw near to the throne of grace.” – Hebrews 4:16',
  },
  {
    id: 'news-004',
    slug: 'dmrc-youth-collective-on-mission',
    title: 'Youth Collective Serves Across the Diocese',
    summary:
      'The Youth Discipleship Collective coordinated mission trips to four parishes, leading retreats and evangelization outreaches.',
    publishedOn: '2024-12-18',
    author: 'Youth Discipleship Collective',
    heroImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=80',
    tag: 'Event',
    readingTime: '5 min read',
    content: [
      {
        paragraphs: [
          'The Youth Discipleship Collective recently coordinated mission trips to four parish communities, offering youth retreats, street evangelization, and mercy service projects. Teams composed of high school and university students ministered alongside priests and consecrated leaders.',
        ],
      },
      {
        heading: 'Equipping Young Missionaries',
        paragraphs: [
          'Each mission day began with worship, intercession, and commissioning prayer. Workshops helped young evangelists develop testimonies, lead small groups, and organize outreach events in their local contexts.',
        ],
      },
      {
        heading: 'Fruit That Lasts',
        paragraphs: [
          'Pastors reported increased engagement from youth and families following the visits. Several parishes have requested ongoing accompaniment, and the collective is planning a summer mission intensive for new leaders.',
        ],
      },
    ],
  },
]

export const eventHighlights: EventHighlight[] = [
  {
    id: 'event-001',
    title: 'Mercy Night Vigil',
    dateRange: 'March 7, 2025 · 8:00 PM – Midnight',
    location: 'DMRC Main Sanctuary',
    description:
      'An evening of Eucharistic adoration, prophetic intercession, and healing ministry. Confessions available throughout the night.',
    ctaLabel: 'RSVP Online',
    ctaHref: '/events/mission-outreach-retreat',
  },
  {
    id: 'event-002',
    title: 'Youth Discipleship Summit',
    dateRange: 'April 12, 2025 · 9:00 AM – 5:00 PM',
    location: 'DMRC Conference Hall',
    description:
      'Formation day for youth leaders featuring workshops on evangelization, media outreach, and prayer ministry.',
    ctaLabel: 'Register Team',
    ctaHref: '/events/youth-revival-retreat',
  },
  {
    id: 'event-003',
    title: 'Family Covenant Renewal',
    dateRange: 'May 3–4, 2025',
    location: 'Divine Mercy Retreat Center',
    description:
      'Weekend retreat offering talks, sacraments, and guided prayer for couples and families seeking fresh grace in their vocation.',
    ctaLabel: 'View Retreat',
    ctaHref: '/events/holy-family-retreat',
  },
]

export const pressMentions: PressMention[] = [
  {
    id: 'press-001',
    outlet: 'Catholic Herald',
    title: 'Mercy on the Move: How DMRC Serves the Diocese',
    url: 'https://example.com/catholic-herald-dmrc',
    publishedOn: '2025-01-10',
  },
  {
    id: 'press-002',
    outlet: 'Kerala Catholic News',
    title: 'Youth Collective Empowers Evangelization Teams',
    url: 'https://example.com/kerala-catholic-dmrc',
    publishedOn: '2024-11-22',
  },
  {
    id: 'press-003',
    outlet: 'Mission Today',
    title: 'Divine Mercy Retreat Center Launches Media Studio',
    url: 'https://example.com/mission-today-dmrc',
    publishedOn: '2024-09-15',
  },
]

