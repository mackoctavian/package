import { NextResponse } from 'next/server'

import { uploadToSupabaseStorage } from '@/lib/supabase/uploads'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const folder = (formData.get('folder') as string | null) || 'uploads'

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB).' }, { status: 400 })
    }

    const result = await uploadToSupabaseStorage(file, folder)
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[uploads][POST]', error)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}


