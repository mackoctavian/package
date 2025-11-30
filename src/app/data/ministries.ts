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
    activities: [
      {
        id: 'activity-001',
        title: 'Healing Prayer Service',
        description: 'Weekly healing prayer service with testimonies and personal ministry.',
        image: '/images/dmrc/gallery/IMG_0299.JPG',
        date: '2024-11-15',
      },
      {
        id: 'activity-002',
        title: 'Inner Healing Retreat',
        description: 'Monthly half-day retreat focused on emotional and spiritual healing.',
        image: '/images/dmrc/gallery/IMG_0300.JPG',
        date: '2024-11-10',
      },
      {
        id: 'activity-003',
        title: 'Home Visit Ministry',
        description: 'Volunteer teams visiting the sick and homebound in the community.',
        image: '/images/dmrc/gallery/IMG_0301.JPG',
        date: '2024-11-05',
      },
    ],
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
    activities: [
      {
        id: 'activity-youth-001',
        title: 'Youth Discipleship Night',
        description: 'Weekly gathering with worship, teaching, and small group discipleship.',
        image: '/images/dmrc/gallery/IMG_0296.JPG',
        date: '2024-11-20',
      },
      {
        id: 'activity-youth-002',
        title: 'Mission Outreach',
        description: 'Youth teams engaging in street evangelization and community service.',
        image: '/images/dmrc/gallery/IMG_0297.JPG',
        date: '2024-11-12',
      },
    ],
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
    activities: [
      {
        id: 'activity-family-001',
        title: 'Covenant Renewal Weekend',
        description: 'Married couples experiencing healing and renewed vows in the Holy Spirit.',
        image: '/images/dmrc/gallery/IMG_0298.JPG',
        date: '2024-11-18',
      },
      {
        id: 'activity-family-002',
        title: 'Family Formation Day',
        description: 'Full day program with tracks for parents and children.',
        image: '/images/dmrc/gallery/IMG_0302.JPG',
        date: '2024-11-03',
      },
    ],
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
  {
    id: 'ministry-005',
    slug: 'residential-retreats',
    title: 'Residential Retreats Ministry',
    shortDescription:
      'Extended retreat experiences offering deep spiritual formation, prayer, and community for those seeking extended time with the Lord.',
    overview:
      'The Residential Retreats Ministry provides extended spiritual formation opportunities for individuals and groups seeking deeper encounter with God. These retreats range from weekend programs to week-long intensive experiences, offering participants time for prayer, reflection, sacramental life, and community building within the retreat center setting.',
    heroImage: '/images/courses/coursesOne.svg',
    highlightScripture: '“Come away by yourselves to a quiet place and rest a while.” — Mark 6:31',
    focusAreas: [
      {
        title: 'Weekend Retreats',
        description: 'Two to three-day residential programs focusing on spiritual renewal and formation.',
      },
      {
        title: 'Extended Programs',
        description: 'Week-long intensive retreats offering comprehensive spiritual direction and formation.',
      },
      {
        title: 'Group Accommodations',
        description: 'Customized residential retreats for parishes, organizations, and faith communities.',
      },
    ],
    gatherings: [
      { day: 'Various Weekends', time: 'Check Schedule', description: 'Multiple residential retreat options throughout the year.' },
      { day: 'Seasonal Programs', time: 'As Announced', description: 'Extended retreat programs during Advent, Lent, and summer seasons.' },
    ],
    contact: {
      coordinator: 'Retreat Coordinator',
      email: 'retreats@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-006',
    slug: 'saturday-service',
    title: 'Saturday Service Ministry',
    shortDescription:
      'Weekly Saturday service programs offering prayer, worship, teaching, and fellowship for the community.',
    overview:
      'The Saturday Service Ministry provides regular weekly gatherings that combine prayer, worship, teaching, and community fellowship. These services offer an accessible entry point for those seeking spiritual growth and community connection. Each service includes scripture-based teaching, intercessory prayer, and opportunities for personal ministry.',
    heroImage: '/images/courses/coursesTwo.svg',
    highlightScripture: '“Do not neglect to meet together, as is the habit of some.” — Hebrews 10:25',
    focusAreas: [
      {
        title: 'Worship & Teaching',
        description: 'Scripture-based teaching sessions combined with contemporary worship and praise.',
      },
      {
        title: 'Prayer Ministry',
        description: 'Personal prayer ministry and intercession available during and after services.',
      },
      {
        title: 'Community Fellowship',
        description: 'Opportunities for connection, relationship building, and mutual encouragement.',
      },
    ],
    gatherings: [
      { day: 'Saturdays', time: '10:00 AM – 12:00 PM', description: 'Weekly service with worship, teaching, and prayer ministry.' },
      { day: 'First Saturdays', time: 'Special Service', description: 'Enhanced service with additional prayer and fellowship time.' },
    ],
    contact: {
      coordinator: 'Service Coordinator',
      email: 'saturday@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-007',
    slug: 'special-retreats',
    title: 'Special Retreats Ministry',
    shortDescription:
      'Themed retreat experiences designed for specific groups, occasions, and spiritual needs.',
    overview:
      'The Special Retreats Ministry organizes unique, theme-based retreat experiences tailored to specific audiences and spiritual seasons. These include healing retreats, vocational discernment programs, marriage enrichment weekends, and seasonal retreats that align with the liturgical calendar.',
    heroImage: '/images/courses/coursesThree.svg',
    highlightScripture: '“Behold, I am doing a new thing; now it springs forth, do you not perceive it?” — Isaiah 43:19',
    focusAreas: [
      {
        title: 'Themed Retreats',
        description: 'Specialized retreats focused on healing, vocation, marriage, and spiritual growth themes.',
      },
      {
        title: 'Seasonal Programs',
        description: 'Retreats aligned with Advent, Lent, Easter, and other liturgical seasons.',
      },
      {
        title: 'Group-Specific Retreats',
        description: 'Customized retreats for youth, couples, singles, clergy, and religious communities.',
      },
    ],
    gatherings: [
      { day: 'As Scheduled', time: 'Varies', description: 'Special retreat programs announced quarterly.' },
      { day: 'Seasonal', time: 'Check Calendar', description: 'Major seasonal retreats during key liturgical periods.' },
    ],
    contact: {
      coordinator: 'Special Retreats Coordinator',
      email: 'special@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-008',
    slug: 'bible-convention',
    title: 'Bible Convention Ministry',
    shortDescription:
      'Annual and regional Bible conventions bringing together believers for teaching, worship, and fellowship centered on God’s Word.',
    overview:
      'The Bible Convention Ministry organizes large-scale gatherings focused on Scripture study, biblical teaching, and equipping believers with tools for deeper engagement with God’s Word. These conventions feature renowned speakers, workshops, worship, and opportunities for participants to grow in their understanding and application of Scripture.',
    heroImage: '/images/courses/coursesFour.svg',
    highlightScripture: '“Your word is a lamp to my feet and a light to my path.” — Psalm 119:105',
    focusAreas: [
      {
        title: 'Annual Convention',
        description: 'Major annual gathering with renowned biblical scholars and teachers.',
      },
      {
        title: 'Regional Gatherings',
        description: 'Smaller regional conventions making biblical formation accessible locally.',
      },
      {
        title: 'Workshops & Seminars',
        description: 'Practical workshops on Bible study methods, interpretation, and application.',
      },
    ],
    gatherings: [
      { day: 'Annual Event', time: 'As Announced', description: 'Major annual Bible convention with multiple sessions over several days.' },
      { day: 'Regional Events', time: 'Quarterly', description: 'Regional Bible study gatherings throughout the year.' },
    ],
    contact: {
      coordinator: 'Bible Convention Coordinator',
      email: 'bible@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-009',
    slug: 'bible-children',
    title: 'Bible Children Ministry',
    shortDescription:
      'Engaging Scripture programs designed to help children encounter God’s Word through age-appropriate teaching, activities, and worship.',
    overview:
      'The Bible Children Ministry introduces young hearts to the beauty and truth of Scripture through creative, interactive programs. Children learn biblical stories, participate in worship, engage in crafts and activities, and develop a love for God’s Word that will guide them throughout their lives.',
    heroImage: '/images/courses/coursesOne.svg',
    highlightScripture: '“Let the children come to me, and do not hinder them.” — Matthew 19:14',
    focusAreas: [
      {
        title: 'Sunday Programs',
        description: 'Regular Sunday sessions with Bible stories, songs, and age-appropriate teaching.',
      },
      {
        title: 'Vacation Bible School',
        description: 'Annual summer program with themed activities, crafts, and Scripture learning.',
      },
      {
        title: 'Children\'s Worship',
        description: 'Engaging worship experiences designed specifically for young children.',
      },
    ],
    gatherings: [
      { day: 'Sundays', time: '10:00 AM – 11:30 AM', description: 'Regular children\'s Bible program during service times.' },
      { day: 'Summer', time: 'VBS Schedule', description: 'Annual Vacation Bible School program with extended activities.' },
    ],
    contact: {
      coordinator: 'Children\'s Ministry Coordinator',
      email: 'children@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-010',
    slug: 'spiritual-counselling',
    title: 'Spiritual Counselling Ministry',
    shortDescription:
      'Providing compassionate spiritual direction and counselling to support individuals and families on their faith journey.',
    overview:
      'The Spiritual Counselling Ministry offers confidential, Christ-centered counselling and spiritual direction to help individuals navigate life challenges, deepen their relationship with God, and find healing and wholeness. Trained counselors and spiritual directors provide guidance rooted in Scripture and Catholic teaching.',
    heroImage: '/images/courses/coursesTwo.svg',
    highlightScripture: '“Cast all your anxiety on him because he cares for you.” — 1 Peter 5:7',
    focusAreas: [
      {
        title: 'Individual Counselling',
        description: 'One-on-one sessions addressing personal struggles, relationships, and spiritual growth.',
      },
      {
        title: 'Marriage & Family',
        description: 'Counselling services for couples and families seeking reconciliation and healing.',
      },
      {
        title: 'Spiritual Direction',
        description: 'Ongoing spiritual direction for those seeking deeper intimacy with God.',
      },
    ],
    gatherings: [
      { day: 'By Appointment', time: 'Flexible', description: 'Individual and group counselling sessions scheduled as needed.' },
      { day: 'Support Groups', time: 'Weekly', description: 'Group support sessions for specific needs and situations.' },
    ],
    contact: {
      coordinator: 'Counselling Coordinator',
      email: 'counselling@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-011',
    slug: 'parish-retreat',
    title: 'Parish Retreat Ministry',
    shortDescription:
      'Organizing and facilitating retreats specifically designed for parish communities and faith groups.',
    overview:
      'The Parish Retreat Ministry works with local parishes and faith communities to organize and facilitate customized retreat experiences. These retreats strengthen parish unity, deepen faith commitment, and equip parishioners for mission. Services include program planning, speaker coordination, and on-site retreat facilitation.',
    heroImage: '/images/courses/coursesThree.svg',
    highlightScripture: '“For where two or three gather in my name, there am I with them.” — Matthew 18:20',
    focusAreas: [
      {
        title: 'Parish Planning',
        description: 'Assistance with planning and organizing parish-wide retreat experiences.',
      },
      {
        title: 'Customized Programs',
        description: 'Tailored retreat content to meet specific parish needs and goals.',
      },
      {
        title: 'Follow-up Support',
        description: 'Resources and support for maintaining retreat fruits in parish life.',
      },
    ],
    gatherings: [
      { day: 'By Request', time: 'Flexible', description: 'Retreats scheduled based on parish needs and availability.' },
      { day: 'Seasonal', time: 'Advent/Lent', description: 'Special parish retreat opportunities during liturgical seasons.' },
    ],
    contact: {
      coordinator: 'Parish Retreat Coordinator',
      email: 'parish@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-012',
    slug: 'jesus-mission-retreat',
    title: 'Jesus Mission Retreat Ministry',
    shortDescription:
      'Mission-focused retreats equipping participants to share the Gospel and serve in evangelization and outreach.',
    overview:
      'The Jesus Mission Retreat Ministry provides intensive formation experiences that prepare participants for evangelization and mission work. These retreats combine prayer, teaching on mission identity, practical training, and hands-on outreach opportunities. Participants are equipped and sent forth to share the mercy and love of Christ in their communities and beyond.',
    heroImage: '/images/courses/coursesFour.svg',
    highlightScripture: '“Go therefore and make disciples of all nations.” — Matthew 28:19',
    focusAreas: [
      {
        title: 'Mission Formation',
        description: 'Teaching on mission identity, evangelization methods, and sharing faith effectively.',
      },
      {
        title: 'Practical Training',
        description: 'Hands-on training in street evangelization, door-to-door outreach, and community service.',
      },
      {
        title: 'Sending Forth',
        description: 'Ongoing support and connection for those engaged in mission work.',
      },
    ],
    gatherings: [
      { day: 'Quarterly', time: 'Weekend Retreats', description: 'Regular mission retreats throughout the year.' },
      { day: 'Intensive', time: 'As Announced', description: 'Extended mission training programs for committed participants.' },
    ],
    contact: {
      coordinator: 'Mission Retreat Coordinator',
      email: 'mission@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-013',
    slug: 'team-members-ministries',
    title: 'Team Members Ministries',
    shortDescription:
      'Supporting and equipping volunteer team members who serve in various capacities throughout the retreat center.',
    overview:
      'The Team Members Ministries provides formation, training, and ongoing support for the dedicated volunteers who serve across all DMRC ministries. This includes orientation programs, ongoing formation sessions, team building activities, and recognition events that honor those who generously give their time and talents.',
    heroImage: '/images/courses/coursesOne.svg',
    highlightScripture: '“Each of you should use whatever gift you have received to serve others.” — 1 Peter 4:10',
    focusAreas: [
      {
        title: 'Volunteer Training',
        description: 'Comprehensive training programs for new and existing volunteers.',
      },
      {
        title: 'Ongoing Formation',
        description: 'Regular formation sessions to deepen spiritual life and service skills.',
      },
      {
        title: 'Team Building',
        description: 'Activities and events that strengthen community and fellowship among volunteers.',
      },
    ],
    gatherings: [
      { day: 'Monthly', time: 'First Saturday', description: 'Monthly team member gathering with formation and fellowship.' },
      { day: 'Quarterly', time: 'As Scheduled', description: 'Quarterly training and recognition events.' },
    ],
    contact: {
      coordinator: 'Volunteer Coordinator',
      email: 'volunteers@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-014',
    slug: 'spiritual-partners',
    title: 'Spiritual Partners Ministry',
    shortDescription:
      'Connecting individuals and families with spiritual companions and accountability partners for mutual encouragement and growth.',
    overview:
      'The Spiritual Partners Ministry facilitates meaningful connections between believers seeking deeper spiritual friendship and accountability. Through structured programs and informal gatherings, participants find prayer partners, accountability relationships, and spiritual friendships that support ongoing growth in faith and holiness.',
    heroImage: '/images/courses/coursesTwo.svg',
    highlightScripture: '“Two are better than one, because they have a good return for their labor.” — Ecclesiastes 4:9',
    focusAreas: [
      {
        title: 'Partner Matching',
        description: 'Connecting individuals with compatible spiritual partners based on needs and goals.',
      },
      {
        title: 'Accountability Groups',
        description: 'Small groups providing mutual accountability and encouragement.',
      },
      {
        title: 'Regular Gatherings',
        description: 'Structured times for partners to meet, pray, and share together.',
      },
    ],
    gatherings: [
      { day: 'Monthly', time: 'As Scheduled', description: 'Monthly gatherings for all spiritual partners.' },
      { day: 'Partner Meetings', time: 'Flexible', description: 'Regular meetings between matched partners.' },
    ],
    contact: {
      coordinator: 'Spiritual Partners Coordinator',
      email: 'partners@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-015',
    slug: 'dmrc-benefactors',
    title: 'DMRC Benefactors Ministry',
    shortDescription:
      'Honoring and stewarding the generous supporters whose contributions enable the mission and work of the retreat center.',
    overview:
      'The DMRC Benefactors Ministry recognizes, honors, and maintains relationships with those who financially support the retreat center through regular giving, special donations, and legacy gifts. This ministry provides stewardship, communication, and opportunities for benefactors to see the impact of their generosity.',
    heroImage: '/images/courses/coursesThree.svg',
    highlightScripture: '“Each of you should give what you have decided in your heart to give.” — 2 Corinthians 9:7',
    focusAreas: [
      {
        title: 'Stewardship',
        description: 'Transparent communication about how gifts are used to advance the mission.',
      },
      {
        title: 'Recognition',
        description: 'Appropriate recognition and appreciation for generous supporters.',
      },
      {
        title: 'Relationship Building',
        description: 'Ongoing connection and updates on the impact of benefactor support.',
      },
    ],
    gatherings: [
      { day: 'Annual', time: 'Benefactor Appreciation', description: 'Annual event honoring and thanking all benefactors.' },
      { day: 'Quarterly', time: 'Updates & Reports', description: 'Regular communication about ministry impact and needs.' },
    ],
    contact: {
      coordinator: 'Development Coordinator',
      email: 'benefactors@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-016',
    slug: 'media-ministries',
    title: 'Media Ministries',
    shortDescription:
      'Creating and distributing content that shares the message of mercy through digital platforms, publications, and multimedia.',
    overview:
      'The Media Ministries produces a wide range of content to communicate the mission and message of DMRC. This includes video production, podcasting, social media content, printed materials, website management, and other forms of media that extend the reach of the retreat center\'s ministry and teaching.',
    heroImage: '/images/courses/coursesFour.svg',
    highlightScripture: '“Go into all the world and proclaim the gospel to the whole creation.” — Mark 16:15',
    focusAreas: [
      {
        title: 'Content Creation',
        description: 'Producing video, audio, and written content for various platforms and audiences.',
      },
      {
        title: 'Digital Presence',
        description: 'Managing social media, website, and online presence to reach wider audiences.',
      },
      {
        title: 'Publications',
        description: 'Creating printed materials, newsletters, and publications that share testimonies and teaching.',
      },
    ],
    gatherings: [
      { day: 'Weekly', time: 'Content Planning', description: 'Regular planning meetings for content creation and distribution.' },
      { day: 'As Needed', time: 'Production', description: 'Video and audio production sessions as content is created.' },
    ],
    contact: {
      coordinator: 'Media Director',
      email: 'media@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
  {
    id: 'ministry-017',
    slug: 'religious-article',
    title: 'Religious Article Ministry',
    shortDescription:
      'Curating and distributing religious articles, devotional materials, and spiritual resources to support faith formation.',
    overview:
      'The Religious Article Ministry provides access to quality religious articles, devotional materials, books, and spiritual resources that support ongoing faith formation. This includes maintaining a resource library, curating recommended reading, and making religious articles and materials available for purchase or loan.',
    heroImage: '/images/courses/coursesOne.svg',
    highlightScripture: '“All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness.” — 2 Timothy 3:16',
    focusAreas: [
      {
        title: 'Resource Library',
        description: 'Maintaining a collection of books, articles, and materials for study and formation.',
      },
      {
        title: 'Curated Recommendations',
        description: 'Providing guidance on quality resources for different spiritual needs and interests.',
      },
      {
        title: 'Article Distribution',
        description: 'Making religious articles and devotional materials accessible to the community.',
      },
    ],
    gatherings: [
      { day: 'During Office Hours', time: 'Mon-Fri 9AM-5PM', description: 'Resource library and article distribution available during regular hours.' },
      { day: 'Special Events', time: 'As Scheduled', description: 'Resource tables and displays during major retreats and events.' },
    ],
    contact: {
      coordinator: 'Resource Coordinator',
      email: 'resources@dmrc.org',
      phone: '+255 765 572 679',
    },
  },
]

