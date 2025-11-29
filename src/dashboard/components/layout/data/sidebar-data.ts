import {
  BadgePercent,
  Boxes,
  Building2,
  FolderTree,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  ListTodo,
  MessagesSquare,
  Monitor,
  Package,
  Palette,
  Receipt,
  Store,
  Settings,
  Users,
  Wrench,
  Bell,
  BarChart3,
  TrendingUp,
  CreditCard,
} from 'lucide-react'
import { type NavGroup } from '../types'

export const sidebarNavGroups: NavGroup[] = [
  {
    title: 'General',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Transactions',
        url: '/dashboard/transactions',
        icon: Monitor,
      },
      {
        title: 'Inventory',
        icon: Boxes,
        items: [
          {
            title: 'Items',
            url: '/dashboard/inventory/items',
            icon: Package,
          },
          {
            title: 'Categories',
            url: '/dashboard/inventory/categories',
            icon: FolderTree,
          },
          {
            title: 'Discounts',
            url: '/dashboard/inventory/discounts',
            icon: BadgePercent,
          },
          {
            title: 'Departments',
            url: '/dashboard/inventory/departments',
            icon: Building2,
          },
        ],
      },
      {
        title: 'Reports',
        icon: BarChart3,
        items: [
          {
            title: 'Sales report',
            url: '/dashboard/reports/sales',
            icon: TrendingUp,
          },
          {
            title: 'Items sales',
            url: '/dashboard/reports/items-sales',
            icon: LineChart,
          },
          {
            title: 'Category sales',
            url: '/dashboard/reports/category-sales',
            icon: FolderTree,
          },
          {
            title: 'Team sales',
            url: '/dashboard/reports/team-sales',
            icon: Users,
          },
          {
            title: 'Department sales',
            url: '/dashboard/reports/department-sales',
            icon: Building2,
          },
          {
            title: 'Expenses report',
            url: '/dashboard/reports/expenses',
            icon: Receipt,
          },
        ],
      },
      {
        title: 'Team Members',
        url: '/dashboard/users',
        icon: Users,
      },
    ],
  },
  {
    title: 'Other',
    items: [
      {
        title: 'Settings',
        icon: Settings,
        items: [
          {
            title: 'Account',
            url: '/dashboard/settings/account',
            icon: Wrench,
          },
          {
            title: 'Business',
            url: '/dashboard/settings/business',
            icon: Store,
          },
          {
            title: 'Subscription',
            url: '/dashboard/settings/subscription',
            icon: CreditCard,
          },
          {
            title: 'Appearance',
            url: '/dashboard/settings/appearance',
            icon: Palette,
          },
          {
            title: 'Notifications',
            url: '/dashboard/settings/notifications',
            icon: Bell,
          },
        ],
      },
      {
        title: 'Help Center',
        url: '/dashboard/help-center',
        icon: HelpCircle,
      },
    ],
  },
]
