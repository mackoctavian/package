import type { ComponentType } from 'react'
import Link from 'next/link'
import { CalendarDays, Images, LayoutDashboard, Newspaper, Users, BookOpen, Globe2, Share2, Home, Sparkles, MessageSquare } from 'lucide-react'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { type AdminModuleId } from '@/lib/auth/admin-permissions'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'
import { userHasModuleAccess } from '@/lib/auth/admin-shared'

const MODULES: Array<{
  name: string
  href: string
  icon: ComponentType<{ className?: string }>
  description: string
  featured?: boolean
  moduleId: AdminModuleId
}> = [
  {
    name: 'Homepage',
    href: '/admin/homepage',
    icon: Home,
    description: 'Manage hero carousel, patrons, testimonials, and quick links.',
    featured: true,
    moduleId: 'homepage',
  },
  {
    name: 'Retreats',
    href: '/admin/retreats',
    icon: LayoutDashboard,
    description: 'Create sessions, manage attendees, and confirm payments.',
    moduleId: 'retreats',
  },
  {
    name: 'Gallery',
    href: '/admin/gallery',
    icon: Images,
    description: 'Update photos, videos, audio, and CDs in the media gallery.',
    moduleId: 'gallery',
  },
  {
    name: 'News & Events',
    href: '/admin/news',
    icon: Newspaper,
    description: 'Publish missions, upcoming events, and ministry highlights.',
    moduleId: 'news',
  },
  {
    name: 'Feedback',
    href: '/admin/feedback',
    icon: MessageSquare,
    description: 'Read and triage contact form submissions in one inbox.',
    moduleId: 'feedback',
  },
  {
    name: 'Publications',
    href: '/admin/publications',
    icon: BookOpen,
    description: 'Manage pastoral letters, magazines, and downloadable PDFs.',
    moduleId: 'publications',
  },
  {
    name: 'Articles',
    href: '/admin/articles',
    icon: Sparkles,
    description: 'Publish articles, reflections, and long-form stories.',
    moduleId: 'articles',
  },
  {
    name: 'Patrons',
    href: '/admin/patrons',
    icon: Users,
    description: 'Update patrons, clergy, and testimonial references.',
    moduleId: 'patrons',
  },
  {
    name: 'Ministries',
    href: '/admin/ministries',
    icon: Share2,
    description: 'Highlight ministry teams, focus areas, and impact stories.',
    moduleId: 'ministries',
  },
  {
    name: 'About',
    href: '/admin/about',
    icon: Globe2,
    description: 'Keep the about page fresh with mission, vision, and leadership updates.',
    moduleId: 'about',
  },
  {
    name: 'Admin Team',
    href: '/admin/team',
    icon: Users,
    description: 'Invite teammates and configure their module permissions.',
    moduleId: 'team',
  },
]

const buildContentCounter = (type: string) => () => prisma.contentItem.count({ where: { type } })

const MODULE_COUNT_RESOLVERS: Partial<Record<AdminModuleId, () => Promise<number>>> = {
  homepage: async () => {
    const [heroSlides, quickLinks, patrons, testimonials] = await Promise.all([
      prisma.heroSlide.count(),
      prisma.quickLink.count(),
      prisma.patron.count(),
      prisma.testimonial.count(),
    ])
    return heroSlides + quickLinks + patrons + testimonials
  },
  retreats: async () => prisma.retreat.count(),
  gallery: buildContentCounter('gallery'),
  news: buildContentCounter('news'),
  events: buildContentCounter('events'),
  publications: buildContentCounter('publications'),
  articles: buildContentCounter('articles'),
  patrons: buildContentCounter('patrons'),
  ministries: () => prisma.ministry.count(),
  about: buildContentCounter('about'),
  feedback: () => prisma.feedbackMessage.count(),
  team: () => prisma.adminUser.count(),
}

export default async function AdminOverviewPage() {
  const currentUser = await requireAdminPageAccess('overview')
  const retreatCount = await prisma.retreat.count()

  const accessibleModules = MODULES.filter((module) => userHasModuleAccess(currentUser, module.moduleId))

  const contentSummary = await Promise.all(
    accessibleModules.map(async (module) => {
      if (module.moduleId === 'retreats') {
        return { ...module, count: retreatCount }
      }
      const resolver = MODULE_COUNT_RESOLVERS[module.moduleId]
      const count = resolver ? await resolver() : 0
      return { ...module, count }
    }),
  )

  return (
    <div className='space-y-8 px-6 py-8'>
      <header className='flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Mercy CMS</p>
          <h1 className='mt-2 text-4xl font-semibold text-slate-900'>Divine Mercy content console</h1>
          <p className='mt-3 max-w-2xl text-sm text-slate-500'>
            Manage retreats, media, and pastoral communication from a single pane of glass. Every update instantly reflects across
            the public experience.
          </p>
        </div>
        <Button asChild className='gap-2'>
          <Link href='/admin/retreats'>
            <CalendarDays className='h-4 w-4' />
            New retreat
          </Link>
        </Button>
      </header>

      <section className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardDescription>Retreats scheduled</CardDescription>
            <CardTitle className='text-3xl'>{retreatCount}</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-slate-500'>Active retreats synced from the database.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Published media</CardDescription>
            <CardTitle className='text-3xl'>{contentSummary.find((item) => item.name === 'Gallery')?.count ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-slate-500'>Images visible in the gallery grid.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Stories & publications</CardDescription>
            <CardTitle className='text-3xl'>
              {(contentSummary.find((item) => item.name === 'News & Events')?.count ?? 0) +
                (contentSummary.find((item) => item.name === 'Publications')?.count ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-slate-500'>Combined pastoral letters and public announcements.</CardContent>
        </Card>
      </section>

      <section className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {contentSummary.map((module) => (
          <Card key={module.name} className={`flex flex-col justify-between border-slate-200 ${(module as any).featured ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <CardTitle className='text-lg'>{module.name}</CardTitle>
                  {(module as any).featured && (
                    <Sparkles className='w-4 h-4 text-blue-500' />
                  )}
                </div>
                <Badge className='rounded-full bg-slate-100 text-slate-600'>{module.count}</Badge>
              </div>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant={(module as any).featured ? 'default' : 'outline'} className={`w-full ${(module as any).featured ? 'bg-blue-600 hover:bg-blue-700' : ''}`} asChild>
                <Link href={module.href}>Manage {module.name}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

