"use client"

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminRole } from '@prisma/client'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Switch } from '@/app/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Checkbox } from '@/app/components/ui/checkbox'
import { ADMIN_MODULES, AdminModuleId } from '@/lib/auth/admin-permissions'
import { Loader2, Lock, Plus, ShieldCheck, Users } from 'lucide-react'

type AdminUserRecord = {
  id: string
  name: string
  email: string
  role: AdminRole
  allowedModules: AdminModuleId[]
  isActive: boolean
  createdAt: string
}

type ModulesResponse = {
  data: AdminUserRecord[]
  modules: typeof ADMIN_MODULES
}

const emptyInviteForm = {
  name: '',
  email: '',
  password: '',
  role: 'EDITOR' as AdminRole,
  allowedModules: ['overview'] as AdminModuleId[],
}

const emptyEditForm = {
  name: '',
  email: '',
  role: 'EDITOR' as AdminRole,
  modules: ['overview'] as AdminModuleId[],
  isActive: true,
  password: '',
}

export function AdminMembersManager() {
  const queryClient = useQueryClient()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState(emptyInviteForm)
  const [editUser, setEditUser] = useState<AdminUserRecord | null>(null)
  const [editForm, setEditForm] = useState(emptyEditForm)

  const usersQuery = useQuery<ModulesResponse>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to load admins')
      }
      return (await response.json()) as ModulesResponse
    },
  })

  const members = usersQuery.data?.data ?? []
  const moduleOptions = usersQuery.data?.modules ?? ADMIN_MODULES

  const stats = useMemo(() => {
    const active = members.filter((member) => member.isActive).length
    const privilegeMap = members.reduce<Record<AdminRole, number>>(
      (acc, member) => ({ ...acc, [member.role]: (acc[member.role] ?? 0) + 1 }),
      { SUPERADMIN: 0, EDITOR: 0, VIEWER: 0 },
    )
    return { total: members.length, active, privilegeMap }
  }, [members])

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to invite admin')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Admin invited successfully')
      setInviteForm(emptyInviteForm)
      setIsInviteOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: handleError,
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editUser) return
      const payload: Record<string, unknown> = {
        role: editForm.role,
        allowedModules: editForm.modules,
        isActive: editForm.isActive,
      }
      if (editForm.name.trim() && editForm.name.trim() !== editUser.name) {
        payload.name = editForm.name.trim()
      }
      if (editForm.email.trim() && editForm.email.trim().toLowerCase() !== editUser.email.toLowerCase()) {
        payload.email = editForm.email.trim().toLowerCase()
      }
      if (editForm.password.trim()) {
        payload.password = editForm.password
      }
      const response = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'Unable to update admin')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Admin updated')
      setIsEditOpen(false)
      setEditUser(null)
      setEditForm(emptyEditForm)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: handleError,
  })

  const handleOpenEdit = (member: AdminUserRecord) => {
    setEditUser(member)
    setEditForm({
      name: member.name,
      email: member.email,
      role: member.role,
      modules: member.allowedModules,
      isActive: member.isActive,
      password: '',
    })
    setIsEditOpen(true)
  }

  const handleModuleToggle = (formType: 'invite' | 'edit', module: AdminModuleId) => {
    const current = formType === 'invite' ? inviteForm.allowedModules : editForm.modules
    const exists = current.includes(module)
    let next = exists ? current.filter((item) => item !== module) : [...current, module]
    if (!next.length) next = ['overview']
    if (formType === 'invite') {
      setInviteForm((prev) => ({ ...prev, allowedModules: next }))
    } else {
      setEditForm((prev) => ({ ...prev, modules: next }))
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Admin access</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Team members</h1>
          <p className='text-sm text-slate-500 max-w-2xl'>Invite collaborators and control which modules each admin can access.</p>
        </div>
        <Button className='gap-2' onClick={() => setIsInviteOpen(true)}>
          <Plus className='h-4 w-4' /> Invite admin
        </Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total members</CardDescription>
            <CardTitle className='text-3xl'>{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Active</CardDescription>
            <CardTitle className='text-3xl'>{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Super admins</CardDescription>
            <CardTitle className='text-3xl'>{stats.privilegeMap.SUPERADMIN}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Members</CardTitle>
          <CardDescription>Assign modules per admin.</CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <div className='flex h-48 items-center justify-center text-sm text-slate-500'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Loading admins…
            </div>
          ) : members.length === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500'>
              <Users className='h-6 w-6 text-slate-400' />
              <p>No admins yet. Invite your first collaborator.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className='space-y-0.5'>
                        <p className='font-semibold text-slate-900'>{member.name}</p>
                        <p className='text-xs text-slate-500'>{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge>{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1.5'>
                        {member.allowedModules.map((module) => (
                          <Badge key={module} variant='secondary'>
                            {moduleOptions.find((option) => option.id === module)?.label ?? module}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}>
                        {member.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button variant='outline' size='sm' onClick={() => handleOpenEdit(member)}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Invite admin</DialogTitle>
            <DialogDescription>Create a new admin account and set initial access.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Full name'>
                <Input value={inviteForm.name} onChange={(event) => setInviteForm((prev) => ({ ...prev, name: event.target.value }))} />
              </Field>
              <Field label='Email address'>
                <Input
                  type='email'
                  value={inviteForm.email}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </Field>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Temporary password'>
                <Input
                  type='password'
                  value={inviteForm.password}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, password: event.target.value }))}
                />
              </Field>
              <Field label='Role'>
                <select
                  className='w-full rounded-md border border-slate-200 px-3 py-2 text-sm'
                  value={inviteForm.role}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, role: event.target.value as AdminRole }))}
                >
                  <option value='EDITOR'>Editor</option>
                  <option value='VIEWER'>Viewer</option>
                  <option value='SUPERADMIN'>Super admin</option>
                </select>
              </Field>
            </div>
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-slate-700'>Module access</Label>
              <div className='grid grid-cols-2 gap-2'>
                {moduleOptions.map((module) => (
                  <label key={module.id} className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm'>
                    <Checkbox
                      checked={inviteForm.allowedModules.includes(module.id)}
                      onCheckedChange={() => handleModuleToggle('invite', module.id)}
                    />
                    {module.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isLoading}>
              {createMutation.isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Invite admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Manage access</DialogTitle>
            <DialogDescription>Update role, modules, or status for {editUser?.name}.</DialogDescription>
          </DialogHeader>
          {editUser ? (
            <div className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <Field label='Full name'>
                  <Input value={editForm.name} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} />
                </Field>
                <Field label='Email address'>
                  <Input
                    type='email'
                    value={editForm.email}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </Field>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <Field label='Role'>
                  <select
                    className='w-full rounded-md border border-slate-200 px-3 py-2 text-sm'
                    value={editForm.role}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value as AdminRole }))}
                  >
                    <option value='EDITOR'>Editor</option>
                    <option value='VIEWER'>Viewer</option>
                    <option value='SUPERADMIN'>Super admin</option>
                  </select>
                </Field>
                <Field label='Set new password (optional)'>
                  <Input
                    type='password'
                    value={editForm.password}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, password: event.target.value }))}
                  />
                </Field>
              </div>
              <div className='flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2'>
                <div>
                  <p className='text-sm font-medium text-slate-900'>Account status</p>
                  <p className='text-xs text-slate-500'>Disable to temporarily revoke access.</p>
                </div>
                <Switch checked={editForm.isActive} onCheckedChange={(value) => setEditForm((prev) => ({ ...prev, isActive: Boolean(value) }))} />
              </div>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-slate-700'>Module access</Label>
                <div className='grid grid-cols-2 gap-2'>
                  {moduleOptions.map((module) => (
                    <label key={module.id} className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm'>
                      <Checkbox checked={editForm.modules.includes(module.id)} onCheckedChange={() => handleModuleToggle('edit', module.id)} />
                      {module.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='space-y-1.5'>
    <Label className='text-sm font-medium text-slate-700'>{label}</Label>
    {children}
  </div>
)

const handleError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Something went wrong'
  toastError(message)
}

function toastSuccess(message: string) {
  if (typeof window !== 'undefined') {
    import('react-hot-toast').then(({ toast }) => toast.success(message))
  }
}

function toastError(message: string) {
  if (typeof window !== 'undefined') {
    import('react-hot-toast').then(({ toast }) => toast.error(message))
  }
}


