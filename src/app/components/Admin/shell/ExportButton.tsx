'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/app/components/ui/button'

/** Downloads `/api/admin/export/<dataset>` with the given filters as an .xlsx file. */
export function ExportButton({
  dataset,
  filters,
  label = 'Export to Excel',
  variant = 'outline',
}: {
  dataset: string
  filters?: Record<string, string | undefined | null>
  label?: string
  variant?: 'outline' | 'default'
}) {
  const [busy, setBusy] = useState(false)
  const download = async () => {
    setBusy(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters ?? {}).forEach(([key, value]) => value && value !== 'all' && params.set(key, value))
      const response = await fetch(`/api/admin/export/${dataset}${params.size ? `?${params}` : ''}`)
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Export failed.')
      }
      const blob = await response.blob()
      const name = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? `${dataset}.xlsx`
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = name
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Export downloaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button type='button' variant={variant} onClick={download} disabled={busy} className='gap-2'>
      {busy ? <Loader2 className='h-4 w-4 animate-spin' /> : <Download className='h-4 w-4' />}
      {label}
    </Button>
  )
}
