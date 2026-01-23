import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'

type MassIntentionPayload = {
  fullName?: string
  email?: string
  phone?: string
  intentionType?: string
  intentionFor?: string
  intentionDetails?: string
  preferredDate?: string
  numberOfMasses?: number
  donationAmount?: string
  acceptTerms?: boolean
  metadata?: Record<string, unknown>
}

const allowedTypes = ['thanksgiving', 'healing', 'deceased', 'special', 'family'] as const
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const sanitizeString = (value?: string | null, limit = 4000) => {
  if (!value) return ''
  return value.toString().trim().slice(0, limit)
}

const validatePayload = (payload: MassIntentionPayload) => {
  const fullName = sanitizeString(payload.fullName, 160)
  const email = sanitizeString(payload.email, 254).toLowerCase()
  const phone = sanitizeString(payload.phone, 40)
  const intentionType = sanitizeString(payload.intentionType, 40)
  const intentionFor = sanitizeString(payload.intentionFor, 160)
  const intentionDetails = sanitizeString(payload.intentionDetails, 4000)
  const donationAmount = sanitizeString(payload.donationAmount, 32)
  const acceptTerms = payload.acceptTerms === true

  if (!fullName || !email || !phone || !intentionFor || !intentionDetails) {
    return { error: 'Please fill in all required fields.' }
  }

  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  if (!acceptTerms) {
    return { error: 'You must accept the terms before submitting.' }
  }

  if (!allowedTypes.includes(intentionType as (typeof allowedTypes)[number])) {
    return { error: 'Please select a valid intention type.' }
  }

  const numberOfMasses =
    typeof payload.numberOfMasses === 'number' && Number.isFinite(payload.numberOfMasses)
      ? Math.max(1, Math.min(50, Math.round(payload.numberOfMasses)))
      : 1

  let preferredDate: Date | null = null
  if (payload.preferredDate) {
    const parsed = new Date(payload.preferredDate)
    if (Number.isNaN(parsed.getTime())) {
      return { error: 'Please choose a valid preferred date.' }
    }
    preferredDate = parsed
  }

  return {
    data: {
      fullName,
      email,
      phone,
      intentionType,
      intentionFor,
      intentionDetails,
      preferredDate,
      numberOfMasses,
      donationAmount: donationAmount || null,
    },
  }
}

export const GET = async () => {
  const auth = await requireAdminApiAccess('mass-intentions')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const records = await prisma.massIntention.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: records })
  } catch (error) {
    console.error('[mass-intentions][GET]', error)
    return NextResponse.json({ error: 'Unable to load mass intentions.' }, { status: 500 })
  }
}

export const POST = async (request: Request) => {
  try {
    const json = await request.json()
    const validation = validatePayload(json)
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const payload = validation.data

    const created = await prisma.massIntention.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        intentionType: payload.intentionType,
        intentionFor: payload.intentionFor,
        intentionDetails: payload.intentionDetails,
        preferredDate: payload.preferredDate,
        numberOfMasses: payload.numberOfMasses,
        donationAmount: payload.donationAmount,
        metadata: (json?.metadata as Record<string, unknown> | undefined) ?? { source: 'mass-intentions' },
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('[mass-intentions][POST]', error)
    return NextResponse.json({ error: 'Unable to submit mass intention.' }, { status: 500 })
  }
}
