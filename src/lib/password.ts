"use server"

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export const hashPassword = async (password: string) => {
  const normalized = password.trim()
  if (!normalized) {
    throw new Error('Password is required')
  }
  return bcrypt.hash(normalized, SALT_ROUNDS)
}

export const verifyPassword = async (password: string, hash: string) => {
  if (!password || !hash) return false
  return bcrypt.compare(password, hash)
}


