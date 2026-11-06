import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { botResponse, isBotSubmission, rateLimit } from '@/lib/security/public-form'

type FeedbackPayload = {
  firstname?: string
  lastname?: string
  email?: string
  phnumber?: string
  message?: string
  metadata?: Record<string, unknown>
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const sanitizeString = (value?: string | null, limit = 4000) => {
  if (!value) return ''
  return value.toString().trim().slice(0, limit)
}

const validateFeedbackPayload = (payload: FeedbackPayload) => {
  const firstname = sanitizeString(payload.firstname, 120)
  const lastname = sanitizeString(payload.lastname, 120)
  const email = sanitizeString(payload.email, 254).toLowerCase()
  const phnumber = sanitizeString(payload.phnumber, 32)
  const message = sanitizeString(payload.message, 4000)

  if (!firstname || !lastname || !email || !phnumber || !message) {
    return { error: 'Please fill in all required fields.' }
  }

  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  if (message.length < 5) {
    return { error: 'Message is too short.' }
  }

  return { data: { firstname, lastname, email, phnumber, message } }
}

export const GET = async () => {
  const auth = await requireAdminApiAccess('feedback')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const messages = await prisma.feedbackMessage.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: messages })
  } catch (error) {
    console.error('[feedback][GET]', error)
    return NextResponse.json({ error: 'Unable to load feedback.' }, { status: 500 })
  }
}

export const POST = async (request: Request) => {
  const limited = rateLimit(request, 'feedback', { limit: 5, windowMs: 10 * 60_000 })
  if (limited) return limited

  try {
    const json = await request.json()
    if (isBotSubmission(json)) return botResponse()
    const validation = validateFeedbackPayload(json)
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const payload = validation.data

    const created = await prisma.feedbackMessage.create({
      data: {
        firstName: payload.firstname,
        lastName: payload.lastname,
        email: payload.email,
        phoneNumber: payload.phnumber,
        message: payload.message,
        metadata: ((json?.metadata as Prisma.InputJsonValue | undefined) ?? { source: 'homepage/contact-form' }) as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('[feedback][POST]', error)
    return NextResponse.json({ error: 'Unable to submit feedback.' }, { status: 500 })
  }
}


