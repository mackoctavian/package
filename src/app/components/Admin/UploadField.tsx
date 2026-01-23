'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2, Upload, X } from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { cn } from '@/lib/utils'

type UploadFieldProps = {
  label: string
  value?: string
  onChange: (url: string) => void
  folder?: string
  hint?: string
  accept?: string
  className?: string
  placeholder?: string
}

export function UploadField({
  label,
  value,
  onChange,
  folder = 'uploads',
  hint,
  accept = 'image/*',
  className,
  placeholder = 'https://... or upload below',
}: UploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/uploads', { method: 'POST', body: formData })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error || 'Upload failed')
      }

      onChange(json.data?.url)
    } catch (error) {
      console.error('[UploadField]', error)
      if (typeof window !== 'undefined') {
        import('react-hot-toast').then(({ toast }) => toast.error((error as Error).message || 'Upload failed'))
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className='text-sm font-medium text-slate-700'>{label}</Label>
      <div className='flex items-start gap-3'>
        <div className='relative h-20 w-28 overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50'>
          {value ? (
            <Image src={value} alt='Preview' fill className='object-cover' />
          ) : (
            <div className='flex h-full w-full items-center justify-center text-xs text-slate-400'>Preview</div>
          )}
        </div>
        <div className='flex-1 space-y-2'>
          <Input
            type='url'
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <div className='flex flex-wrap items-center gap-2'>
            <Button type='button' variant='outline' disabled={isUploading} className='gap-2 relative overflow-hidden'>
              {isUploading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Upload className='h-4 w-4' />}
              {isUploading ? 'Uploading...' : 'Upload'}
              <input
                type='file'
                accept={accept}
                className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
                onChange={(e) => handleFileChange(e.target.files)}
              />
            </Button>
            {value ? (
              <Button type='button' variant='ghost' size='icon' onClick={() => onChange('')}>
                <X className='h-4 w-4' />
              </Button>
            ) : null}
          </div>
          {hint ? <p className='text-xs text-slate-500'>{hint}</p> : null}
        </div>
      </div>
    </div>
  )
}


