import { NextResponse } from 'next/server'

/**
 * Light abuse protection for the public forms (contact, donations, Mass
 * intentions, retreat bookings and booking lookup).
 *
 * - Rate limit: a per-IP sliding window kept in memory. On serverless hosts
 *   each instance keeps its own window, so this slows down bursts rather than
 *   enforcing a hard global quota. Swap in a shared store (e.g. Upstash Redis)
 *   if abuse becomes a real problem.
 * - Honeypot: forms render a hidden "website" field that people never see.
 *   Bots that fill every field get a fake success response and nothing is saved.
 */

const windows = new Map<string, number[]>()
const MAX_KEYS = 5000

const clientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'

export function rateLimit(request: Request, bucket: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const key = `${bucket}:${clientIp(request)}`
  const now = Date.now()
  const hits = (windows.get(key) ?? []).filter((time) => now - time < windowMs)
  if (hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }
  hits.push(now)
  if (windows.size > MAX_KEYS) windows.clear()
  windows.set(key, hits)
  return null
}

export const HONEYPOT_FIELD = 'website'

/** True when the hidden honeypot field was filled in, which only bots do. */
export const isBotSubmission = (body: unknown) =>
  Boolean(body && typeof body === 'object' && typeof (body as Record<string, unknown>)[HONEYPOT_FIELD] === 'string' && (body as Record<string, string>)[HONEYPOT_FIELD].trim())

export const botResponse = () => NextResponse.json({ data: null }, { status: 202 })
