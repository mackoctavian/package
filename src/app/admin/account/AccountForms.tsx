'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Panel } from '@/app/components/Admin/shell/primitives'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'

const save = async (body: Record<string, string>) => {
  const response = await fetch('/api/admin/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? 'Could not save.')
}

export function AccountForms({ name: initialName }: { name: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [busy, setBusy] = useState<'name' | 'password' | null>(null)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })

  return (
    <div className='grid gap-6 lg:grid-cols-2'>
      <Panel title='Profile'>
        <form
          className='space-y-4'
          onSubmit={async (event) => {
            event.preventDefault()
            setBusy('name')
            try {
              await save({ name })
              toast.success('Profile saved')
              router.refresh()
            } catch (error) {
              toast.error((error as Error).message)
            } finally {
              setBusy(null)
            }
          }}
        >
          <div className='space-y-1.5'>
            <Label htmlFor='account-name'>Display name</Label>
            <Input id='account-name' value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <Button type='submit' disabled={busy === 'name'}>
            {busy === 'name' && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Save
          </Button>
        </form>
      </Panel>

      <Panel title='Password'>
        <form
          className='space-y-4'
          onSubmit={async (event) => {
            event.preventDefault()
            if (passwords.newPassword !== passwords.confirm) {
              toast.error('The new passwords do not match.')
              return
            }
            setBusy('password')
            try {
              await save({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
              toast.success('Password changed')
              setPasswords({ currentPassword: '', newPassword: '', confirm: '' })
            } catch (error) {
              toast.error((error as Error).message)
            } finally {
              setBusy(null)
            }
          }}
        >
          {(
            [
              ['currentPassword', 'Current password', 'current-password'],
              ['newPassword', 'New password', 'new-password'],
              ['confirm', 'Repeat new password', 'new-password'],
            ] as const
          ).map(([key, label, autoComplete]) => (
            <div key={key} className='space-y-1.5'>
              <Label htmlFor={`account-${key}`}>{label}</Label>
              <Input
                id={`account-${key}`}
                type='password'
                autoComplete={autoComplete}
                value={passwords[key]}
                onChange={(event) => setPasswords((prev) => ({ ...prev, [key]: event.target.value }))}
                required
                minLength={key === 'currentPassword' ? undefined : 10}
              />
            </div>
          ))}
          <p className='text-xs text-muted-foreground'>At least 10 characters, with letters and numbers.</p>
          <Button type='submit' disabled={busy === 'password'}>
            {busy === 'password' && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Change password
          </Button>
        </form>
      </Panel>
    </div>
  )
}
