'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

const DEFAULT_FALLBACK = '/images/dmrc/gallery/IMG_0299.JPG'

type SmartImageProps = ImageProps & { fallbackSrc?: string }

/**
 * next/image wrapper that swaps to a local DMRC photo if a remote image
 * (e.g. Unsplash or an uploaded asset) fails to load.
 */
export default function SmartImage({ fallbackSrc = DEFAULT_FALLBACK, src, alt, ...props }: SmartImageProps) {
  const [failed, setFailed] = useState(false)
  return <Image {...props} alt={alt} src={failed ? fallbackSrc : src} onError={() => setFailed(true)} />
}
