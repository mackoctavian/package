/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const retreats = [
  {
    slug: 'dmrc-eucharistic-retreat',
    title: 'DMRC Eucharistic Encounter',
    subtitle: 'Four Days of Adoration & Healing',
    speaker: 'Fr. Christo Thekkanath',
    conductor: 'DMRC Worship Collective',
    description:
      'Enter into the presence of Jesus through Eucharistic adoration, healing services, and powerful testimonies from the Divine Mercy community.',
    dateRange: 'Feb 20 – Feb 23, 2026',
    timeRange: 'Thursday 5:00 PM – Sunday 2:00 PM',
    location: 'Divine Mercy Retreat Center',
    availabilityTotal: 160,
    availabilityMale: 80,
    availabilityFemale: 80,
    status: 'Registration Open',
    imageSrc: '/images/dmrc/gallery/IMG_0296.JPG',
    category: 'family',
    detailHref: '/events/dmrc-eucharistic-retreat',
    ctaHref: '/events/dmrc-eucharistic-retreat#booking',
    price: 2200,
    isPaid: true,
  },
  {
    slug: 'youth-fire-weekend',
    title: 'Youth Fire Weekend',
    subtitle: 'Ignite Your Faith',
    speaker: 'Fr. Binoy PDM',
    conductor: 'DMRC Youth Mission Team',
    description:
      'A high-energy discipleship retreat for teens and young adults featuring worship, breakout tracks, creative arts, and mission challenges.',
    dateRange: 'Mar 7 – Mar 9, 2026',
    timeRange: 'Friday 6:00 PM – Sunday 1:00 PM',
    location: 'DMRC Hills Campus',
    availabilityTotal: 120,
    availabilityMale: 60,
    availabilityFemale: 60,
    status: 'Registration Open',
    imageSrc: '/images/dmrc/gallery/IMG_0299.JPG',
    category: 'youth',
    detailHref: '/events/youth-fire-weekend',
    ctaHref: '/events/youth-fire-weekend#booking',
    price: 1800,
    isPaid: true,
  },
  {
    slug: 'missionaries-of-mercy',
    title: 'Missionaries of Mercy Intensive',
    subtitle: 'Advanced Evangelisation Training',
    speaker: 'Fr. Joseph Mathew',
    conductor: 'DMRC Mission School',
    description:
      'Prepare for parish missions with advanced evangelisation labs, street ministry practicums, and intercession cohorts led by seasoned missionaries.',
    dateRange: 'Apr 10 – Apr 13, 2026',
    timeRange: 'Thursday 9:00 AM – Sunday 6:00 PM',
    location: 'Sacred Heart Parish, City Campus',
    availabilityTotal: 80,
    availabilityMale: 40,
    availabilityFemale: 40,
    status: 'Registration Open',
    imageSrc: '/images/dmrc/gallery/IMG_0300.JPG',
    category: 'mission',
    detailHref: '/events/missionaries-of-mercy',
    ctaHref: '/events/missionaries-of-mercy#booking',
    price: 2500,
    isPaid: true,
  },
  {
    slug: 'diocesan-deacons-retreat',
    title: 'Diocesan Deacons Retreat',
    subtitle: 'Rest & Renewal for Servant Leaders',
    speaker: 'Rev. Fr. Samson Christi PDM',
    conductor: 'DMRC Clergy Team',
    description:
      'Quiet days of prayer, theological refreshers, fraternity, and spiritual direction crafted for permanent deacons and their spouses.',
    dateRange: 'May 1 – May 4, 2026',
    timeRange: 'Friday 4:00 PM – Monday 10:00 AM',
    location: 'Divine Mercy Retreat House',
    availabilityTotal: 40,
    availabilityMale: 40,
    availabilityFemale: 0,
    status: 'Registration Open',
    imageSrc: '/images/dmrc/gallery/IMG_0302.JPG',
    category: 'clergy',
    detailHref: '/events/diocesan-deacons-retreat',
    ctaHref: '/events/diocesan-deacons-retreat#booking',
    price: 3200,
    isPaid: true,
  },
]

async function main() {
  for (const retreat of retreats) {
    await prisma.retreat.upsert({
      where: { slug: retreat.slug },
      update: {
        ...retreat,
        updatedAt: new Date(),
      },
      create: retreat,
    })
  }

  console.log(`Seeded ${retreats.length} retreats ✅`)
}

main()
  .catch((error) => {
    console.error('Seeding failed ❌', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

