'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useBranding } from '@/app/hooks/useBranding'
import { cn } from '@/lib/utils'

type LogoProps = {
  variant?: 'primary' | 'inverse'
  width?: number
  height?: number
  className?: string
  withLink?: boolean
  priority?: boolean
}

const Logo: React.FC<LogoProps> = ({
  variant = 'primary',
  width = 140,
  height = 40,
  className,
  withLink = true,
  priority = true,
}) => {
  const { logoUrl, inverseLogoUrl, logoAlt } = useBranding()
  const src = variant === 'inverse' ? inverseLogoUrl : logoUrl
  const wrapperStyle = {
    width: `${width}px`,
    height: `${height}px`,
  }

  const image = (
    <span className='relative block' style={wrapperStyle}>
      <Image
        src={src}
        alt={logoAlt}
        fill
        sizes={`${width}px`}
        quality={100}
        className='object-contain'
        priority={priority}
      />
    </span>
  )

  if (!withLink) {
    return (
      <span className={cn('inline-flex items-center justify-center', className)} style={wrapperStyle}>
        {image}
      </span>
    )
  }

  return (
    <Link href='/' aria-label='Homepage' className={cn('inline-flex items-center justify-center', className)} style={wrapperStyle}>
      {image}
    </Link>
  )
}

export default Logo
