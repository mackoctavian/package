import crypto from 'node:crypto'

import prisma from '@/lib/prisma'
import { getResendClient, getResendFrom } from '@/lib/email/resend'
import { appBaseUrl } from './invites'

/** How long a reset link works. */
export const RESET_TTL_MINUTES = 60

/**
 * Password reset links need no database table. A token is
 * `<user id>.<expiry>.<signature>`, where the signature is an HMAC over the id,
 * the expiry and the user's current password hash. Setting a new password
 * changes the hash, so each link works only once, and older links stop working too.
 *
 * The HMAC key is PASSWORD_RESET_SECRET when it is set. Otherwise it falls back
 * to DATABASE_URL, which is also server-only and always set.
 */
const secret = () => {
  const value = process.env.PASSWORD_RESET_SECRET || process.env.DATABASE_URL
  if (!value) throw new Error('Set PASSWORD_RESET_SECRET to enable password resets.')
  return value
}

const sign = (userId: string, expires: string, passwordHash: string) =>
  crypto.createHmac('sha256', secret()).update(`${userId}.${expires}.${passwordHash}`).digest('base64url')

export const createResetToken = (user: { id: string; passwordHash: string }) => {
  const expires = (Date.now() + RESET_TTL_MINUTES * 60 * 1000).toString(36)
  const id = Buffer.from(user.id).toString('base64url')
  return `${id}.${expires}.${sign(user.id, expires, user.passwordHash)}`
}

/** Returns the active admin the token belongs to, or why it can't be used. */
export async function readResetToken(token: string) {
  const [id, expires, signature] = token.split('.')
  if (!id || !expires || !signature) return { error: 'invalid' as const }
  if (Number.parseInt(expires, 36) < Date.now()) return { error: 'expired' as const }

  const userId = Buffer.from(id, 'base64url').toString()
  const user = await prisma.adminUser.findUnique({ where: { id: userId } }).catch(() => null)
  if (!user || !user.isActive) return { error: 'invalid' as const }

  const expected = Buffer.from(sign(user.id, expires, user.passwordHash))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return { error: 'invalid' as const }
  return { user }
}

export const resetUrl = (token: string, request?: Request) => `${appBaseUrl(request)}/login/reset/${token}`

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

export async function sendPasswordResetEmail(args: { to: string; name: string; link: string }) {
  if (!process.env.RESEND_API_KEY) return { sent: false as const, reason: 'Email is not configured (RESEND_API_KEY is missing).' }
  const greeting = `Hello ${args.name},`
  const text = [
    greeting,
    '',
    'Someone asked to reset the password for your DMRC admin account.',
    '',
    `Choose a new password here (the link works for ${RESET_TTL_MINUTES} minutes and only once):`,
    args.link,
    '',
    'If this was not you, ignore this email. Your password stays the same.',
  ].join('\n')
  const html = `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Helvetica,Arial,sans-serif;color:#14213d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#14213d;padding:24px 32px;color:#f3e3b5;font-size:13px;letter-spacing:2px;text-transform:uppercase">Divine Mercy Retreat Center</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;font-size:16px">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5">Someone asked to reset the password for your DMRC admin account.</p>
<p style="margin:24px 0"><a href="${escapeHtml(args.link)}" style="display:inline-block;background:#c9a14a;color:#14213d;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px">Choose a new password</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#6b7280">This link works for ${RESET_TTL_MINUTES} minutes and only once. If this was not you, ignore this email. Your password stays the same.</p>
</td></tr></table></td></tr></table></body></html>`

  try {
    const { error } = await getResendClient().emails.send({ from: getResendFrom(), to: args.to, subject: 'Reset your DMRC admin password', text, html })
    if (error) return { sent: false as const, reason: error.message }
    return { sent: true as const }
  } catch (error) {
    return { sent: false as const, reason: error instanceof Error ? error.message : 'Email failed.' }
  }
}
