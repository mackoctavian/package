import { Resend } from 'resend'

export const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY. Add it to your environment variables.')
  }
  return new Resend(apiKey)
}

export const getResendFrom = () => {
  // Example: "DMRC <onboarding@resend.dev>" or "DMRC <no-reply@yourdomain.com>"
  return process.env.RESEND_FROM || 'DMRC <onboarding@resend.dev>'
}

