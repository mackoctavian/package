import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { botResponse, isBotSubmission, rateLimit } from '@/lib/security/public-form'

type DonationPayload = {
  fullName?: string
  email?: string
  phone?: string
  amount?: number
  currency?: string
  paymentMethod?: string
  prayerIntention?: string
  metadata?: Record<string, unknown>
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const sanitizeString = (value?: string | null, limit = 4000) => {
  if (!value) return ''
  return value.toString().trim().slice(0, limit)
}

const validatePayload = (payload: DonationPayload) => {
  const fullName = sanitizeString(payload.fullName, 160)
  const email = sanitizeString(payload.email, 254).toLowerCase()
  const phone = sanitizeString(payload.phone, 40)
  const paymentMethod = sanitizeString(payload.paymentMethod, 32)
  const currency = sanitizeString(payload.currency, 8) || 'TZS'
  const prayerIntention = sanitizeString(payload.prayerIntention, 2000)
  const amount = typeof payload.amount === 'number' ? Math.round(payload.amount) : NaN

  if (!fullName || !email || !phone || !paymentMethod || !Number.isFinite(amount) || amount <= 0) {
    return { error: 'Please fill in all required fields.' }
  }

  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  if (!['card', 'mobile', 'bank'].includes(paymentMethod)) {
    return { error: 'Please select a valid payment method.' }
  }

  return {
    data: {
      fullName,
      email,
      phone,
      amount,
      currency,
      paymentMethod,
      prayerIntention: prayerIntention || null,
    },
  }
}

export const GET = async () => {
  const auth = await requireAdminApiAccess('donations')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const records = await prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: records })
  } catch (error) {
    console.error('[donations][GET]', error)
    return NextResponse.json({ error: 'Unable to load donations.' }, { status: 500 })
  }
}

export const POST = async (request: Request) => {
  const limited = rateLimit(request, 'donations', { limit: 10, windowMs: 10 * 60_000 })
  if (limited) return limited

  try {
    const json = await request.json()
    if (isBotSubmission(json)) return botResponse()
    const validation = validatePayload(json)
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const payload = validation.data

    const created = await prisma.donation.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        amount: payload.amount,
        currency: payload.currency,
        paymentMethod: payload.paymentMethod,
        prayerIntention: payload.prayerIntention,
        metadata: ((json?.metadata as Prisma.InputJsonValue | undefined) ?? { source: 'donation-form' }) as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('[donations][POST]', error)
    return NextResponse.json({ error: 'Unable to submit donation.' }, { status: 500 })
  }
}
