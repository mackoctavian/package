'use client'
import Link from 'next/link'
import { HeaderItem } from '../../../../types/menu'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface HeaderLinkProps {
  item: HeaderItem
  isSticky?: boolean
  onHover?: (item: HeaderItem | null) => void
}

const HeaderLink: React.FC<HeaderLinkProps> = ({
  item,
  isSticky = false,
  onHover,
}) => {
  const path = usePathname()

  return (
    <div
      className='relative group h-full flex items-center'
      onMouseEnter={() => onHover?.(item)}
    >
      <Link
        href={item.href}
        className={`flex items-center gap-1 text-[15px] font-medium transition-colors duration-200 py-4 ${
          path === item.href
            ? 'text-primary'
            : 'text-slate-700 hover:text-primary'
        }`}>
        {item.label}
        {item.submenu && (
          <ChevronDown className='w-4 h-4' />
        )}
      </Link>
    </div>
  )
}

export default HeaderLink
