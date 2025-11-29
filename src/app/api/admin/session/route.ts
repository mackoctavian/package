import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const DEFAULT_EMAIL = 'admin@admin.com'
const DEFAULT_PASSWORD = 'Jesus2025!'
const SESSION_COOKIE = 'admin_session'

const isValidCredentials = (email: string, password: string) =>
  email === (process.env.ADMIN_EMAIL ?? DEFAULT_EMAIL) &&
  password === (process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD)

export const POST = async (request: Request) => {
  const { email, password } = await request.json()

  if (!isValidCredentials(email, password)) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return response
}

export const GET = async () => {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return NextResponse.json({ authenticated: Boolean(session) })
}

export const DELETE = async () => {
  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
  return response
}

