'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
}

const OptimizedImage = ({
  src,
  alt,
  fill,
  width,
  height,
  className,
  priority = false,
  sizes,
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Generate a blur data URL for placeholder
  const shimmer = (w: number, h: number) => `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f1f5f9;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `

  const toBase64 = (str: string) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str)

  const blurDataURL = `data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className='absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse' />
      )}
      {hasError ? (
        <div className='absolute inset-0 bg-slate-100 flex items-center justify-center'>
          <span className='text-slate-400 text-sm'>Failed to load image</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-500',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          placeholder='blur'
          blurDataURL={blurDataURL}
          priority={priority}
          sizes={sizes}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
        />
      )}
    </div>
  )
}

export default OptimizedImage

