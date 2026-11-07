import crypto from 'node:crypto'

import { getResendClient, getResendFrom } from '@/lib/email/resend'
import { ROLE_LABELS } from './admin-permissions'
import type { AdminRole } from '@prisma/client'

export const INVITE_TTL_DAYS = 7

export const createInviteToken = () => {
  const token = crypto.randomBytes(32).toString('base64url')
  return { token, tokenHash: hashInviteToken(token) }
}

export const hashInviteToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

export const inviteExpiry = () => new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

const appBaseUrl = (request?: Request) => {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  if (request) return new URL(request.url).origin
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
}

export const inviteUrl = (token: string, request?: Request) => `${appBaseUrl(request)}/invite/${token}`

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

export const inviteStatus = (invite: { acceptedAt: Date | null; revokedAt: Date | null; expiresAt: Date }): InviteStatus => {
  if (invite.acceptedAt) return 'accepted'
  if (invite.revokedAt) return 'revoked'
  if (invite.expiresAt < new Date()) return 'expired'
  return 'pending'
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

/**
 * Emails the invitation. Returns whether it was sent; when email is not set
 * up the admin can still copy the link from the team page.
 */
export async function sendInviteEmail(args: { to: string; name?: string | null; role: AdminRole; link: string; invitedBy: string }) {
  if (!process.env.RESEND_API_KEY) return { sent: false as const, reason: 'Email is not configured (RESEND_API_KEY is missing).' }
  const greeting = args.name ? `Hello ${args.name},` : 'Hello,'
  const role = ROLE_LABELS[args.role]
  const text = [
    greeting,
    '',
    `${args.invitedBy} has invited you to help manage the Divine Mercy Retreat Center website and admin panel as a ${role}.`,
    '',
    `Accept the invitation and choose your password here (the link works for ${INVITE_TTL_DAYS} days):`,
    args.link,
    '',
    'If you were not expecting this, you can ignore this email.',
  ].join('\n')
  const html = `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Helvetica,Arial,sans-serif;color:#14213d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#14213d;padding:24px 32px;color:#f3e3b5;font-size:13px;letter-spacing:2px;text-transform:uppercase">Divine Mercy Retreat Center</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;font-size:16px">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5"><strong>${escapeHtml(args.invitedBy)}</strong> has invited you to help manage the DMRC admin panel as a <strong>${escapeHtml(role)}</strong>.</p>
<p style="margin:24px 0"><a href="${escapeHtml(args.link)}" style="display:inline-block;background:#c9a14a;color:#14213d;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px">Accept invitation</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#6b7280">This link works for ${INVITE_TTL_DAYS} days. If you were not expecting this, you can ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`

  try {
    const resend = getResendClient()
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to: args.to,
      subject: `You're invited to the DMRC admin panel`,
      text,
      html,
    })
    if (error) return { sent: false as const, reason: error.message }
    return { sent: true as const }
  } catch (error) {
    return { sent: false as const, reason: error instanceof Error ? error.message : 'Email failed.' }
  }
}
