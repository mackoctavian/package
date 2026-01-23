'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2, Upload, X } from 'lucide-react'

import { Label } from '@/app/components/ui/label'
import { cn } from '@/lib/utils'

type MultiImageUploadProps = {
  label: string
  values?: string[]
  onChange: (urls: string[]) => void
  folder?: string
  hint?: string
  accept?: string
  maxItems?: number
  className?: string
}

export function MultiImageUpload({
  label,
  values = [],
  onChange,
  folder = 'uploads',
  hint,
  accept = 'image/*',
  maxItems = 6,
  className,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    if (values.length >= maxItems) {
      return
    }

    setIsUploading(true)
    const uploaded: string[] = []

    try {
      for (const file of Array.from(files).slice(0, maxItems - values.length)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const response = await fetch('/api/uploads', { method: 'POST', body: formData })
        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.error || 'Upload failed')
        }

        if (json.data?.url) {
          uploaded.push(json.data.url)
        }
      }

      if (uploaded.length) {
        onChange([...values, ...uploaded])
      }
    } catch (error) {
      console.error('[MultiImageUpload]', error)
      if (typeof window !== 'undefined') {
        import('react-hot-toast').then(({ toast }) =>
          toast.error((error as Error).message || 'Unable to upload images'),
        )
      }
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const canAddMore = values.length < maxItems

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium text-slate-700'>{label}</Label>
        <span className='text-xs text-slate-500'>
          {values.length}/{maxItems}
        </span>
      </div>
      <div className='grid gap-3 sm:grid-cols-3'>
        {values.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className='group relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50'>
            {url ? (
              <Image src={url} alt={`Gallery image ${index + 1}`} fill className='object-cover' sizes='(max-width: 768px) 100vw, 33vw' />
            ) : null}
            <button
              type='button'
              onClick={() => removeImage(index)}
              className='absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100'>
              <X className='h-4 w-4' />
            </button>
          </div>
        ))}
        {canAddMore ? (
          <label className='relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500 transition hover:border-slate-400 hover:bg-white'>
            <input
              type='file'
              multiple
              accept={accept}
              className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
              onChange={(event) => {
                handleUpload(event.target.files)
                event.target.value = ''
              }}
            />
            {isUploading ? <Loader2 className='h-5 w-5 animate-spin text-slate-400' /> : <Upload className='h-5 w-5 text-slate-400' />}
            <span className='text-xs font-medium'>{isUploading ? 'Uploading…' : 'Add images'}</span>
          </label>
        ) : null}
      </div>
      {hint ? <p className='text-xs text-slate-500'>{hint}</p> : null}
    </div>
  )
}


