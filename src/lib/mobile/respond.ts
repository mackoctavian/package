import { NextResponse } from 'next/server'

/**
 * Helpers for the read-only JSON API used by the DMRC mobile app (`/api/mobile/*`).
 *
 * The app is a native client, so it needs absolute media URLs: bundled images
 * such as `/images/dmrc/gallery/IMG_0299.JPG` are rewritten against the site's
 * own origin. Responses are cacheable for a short time at the edge.
 */

const MEDIA_PATH = /^\/(?!\/)[^?#]*\.(jpe?g|png|webp|gif|avif|svg|mp3|m4a|mp4|wav|ogg)(\?.*)?$/i

const siteOrigin = (request: Request) => {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (configured && !configured.includes('localhost')) return configured
  return new URL(request.url).origin
}

const absolutize = (value: unknown, origin: string): unknown => {
  if (typeof value === 'string') return MEDIA_PATH.test(value) ? `${origin}${encodeURI(value)}` : value
  if (Array.isArray(value)) return value.map((item) => absolutize(item, origin))
  if (value instanceof Date) return value.toISOString()
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, absolutize(item, origin)]))
  }
  return value
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const mobileJson = (request: Request, data: unknown) =>
  NextResponse.json(
    { data: absolutize(data, siteOrigin(request)), generatedAt: new Date().toISOString() },
    {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  )

export const mobileOptions = () => new NextResponse(null, { status: 204, headers: CORS_HEADERS })
