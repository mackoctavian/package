import { randomUUID } from 'crypto'

import { getSupabaseAdmin } from './server'

const sanitizeFilename = (name: string) => name.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-')

export async function uploadToSupabaseStorage(file: File, folder = 'uploads') {
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }

  const bucket = process.env.SUPABASE_UPLOAD_BUCKET || 'uploads'
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const extension = file.name.includes('.') ? file.name.split('.').pop() : ''
  const path = `${folder}/${randomUUID()}-${sanitizeFilename(file.name || 'file')}`
  const contentType = file.type || (extension ? `image/${extension}` : 'application/octet-stream')

  const { data, error } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
    contentType,
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(data?.path || path).data.publicUrl

  return {
    path: data?.path || path,
    url: publicUrl,
    bucket,
  }
}


