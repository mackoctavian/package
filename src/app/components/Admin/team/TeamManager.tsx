'use client'

import { useMemo, useState } from 'react'
import type { AdminRole } from '@prisma/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Mail,
  MoreHorizontal,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users2,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAdminUser } from '@dashboard/context/admin-user'
import { initials } from '@/app/components/Admin/shell/AdminShell'
import { EmptyState, ExportButton, PageBody, PageHeader, Panel } from '@/app/components/Admin/shell/primitives'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { relativeTime } from '@/lib/admin/safe'
import { ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { canEdit, getModuleAccess } from '@/lib/auth/admin-shared'
import { cn } from '@/lib/utils'
import { AccessMatrix, accessSummary, grantsFromLevelMap, type LevelMap, levelsFromGrants, PRESETS, RolePicker } from './AccessEditor'

type Member = {
  id: string
  name: string
  email: string
  role: AdminRole
  allowedModules: string[]
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

type Invite = {
  id: string
  email: string
  name: string | null
  role: AdminRole
  allowedModules: string[]
  invitedBy: string | null
  expiresAt: string
  createdAt: string
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
}

type TeamResponse = { data: Member[]; invites: Invite[] }

const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? 'Something went wrong.')
  return payload as T
}

const roleBadge: Record<AdminRole, string> = {
  SUPERADMIN: 'bg-gold-100 text-gold-700 border-transparent',
  EDITOR: 'bg-navy-50 text-navy-700 border-transparent',
  VIEWER: 'bg-muted text-muted-foreground border-transparent',
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className='flex gap-2'>
      <Input readOnly value={link} onFocus={(event) => event.target.select()} className='font-mono text-xs' aria-label='Invitation link' />
      <Button
        type='button'
        variant='outline'
        onClick={async () => {
          await navigator.clipboard.writeText(link).catch(() => null)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        className='shrink-0 gap-2'
      >
        {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

function AccessDialog({
  mode,
  member,
  open,
  onOpenChange,
}: {
  mode: 'invite' | 'edit'
  member?: Member
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const me = useAdminUser()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState(member?.email ?? '')
  const [name, setName] = useState(member?.name ?? '')
  const [role, setRole] = useState<AdminRole>(member?.role ?? 'EDITOR')
  const [levels, setLevels] = useState<LevelMap>(member ? levelsFromGrants(member.allowedModules, member.role) : { overview: 'view' })
  const [result, setResult] = useState<{ link: string; emailed: boolean; emailError: string | null } | null>(null)

  const mutation = useMutation({
    mutationFn: (): Promise<{ data: Member | { link: string; emailed: boolean; emailError: string | null } }> => {
      const allowedModules = grantsFromLevelMap(levels, role)
      if (mode === 'invite') {
        return api<{ data: { link: string; emailed: boolean; emailError: string | null } }>('/api/admin/invites', {
          method: 'POST',
          body: JSON.stringify({ email, name, role, allowedModules }),
        })
      }
      const changes: Record<string, unknown> = {}
      if (name !== member!.name) changes.name = name
      if (member!.id !== me.id) Object.assign(changes, { role, allowedModules })
      return api<{ data: Member }>(`/api/admin/users/${member!.id}`, { method: 'PATCH', body: JSON.stringify(changes) })
    },
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] })
      if (mode === 'invite' && 'link' in payload.data) {
        setResult(payload.data as { link: string; emailed: boolean; emailError: string | null })
      } else {
        toast.success('Access updated')
        onOpenChange(false)
      }
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const editingSelf = mode === 'edit' && member?.id === me.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto'>
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Invitation ready</DialogTitle>
              <DialogDescription>
                {result.emailed
                  ? `We emailed an invitation to ${email}. You can also share this link with them directly.`
                  : `We couldn't send the email${result.emailError ? ` (${result.emailError})` : ''}. Copy this link and send it to ${email} yourself.`}
              </DialogDescription>
            </DialogHeader>
            <CopyLink link={result.link} />
            <p className='text-xs text-muted-foreground'>The link works for 7 days and can only be used once.</p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
            className='space-y-6'
          >
            <DialogHeader>
              <DialogTitle>{mode === 'invite' ? 'Invite a team member' : `Edit ${member?.name}`}</DialogTitle>
              <DialogDescription>
                {mode === 'invite'
                  ? 'They will get an email with a link to set their password. Choose exactly what they can see and change.'
                  : 'Changes apply straight away. They will be asked to sign in again.'}
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label htmlFor='member-name'>Name</Label>
                <Input id='member-name' value={name} onChange={(event) => setName(event.target.value)} placeholder='e.g. Sr. Maria Mushi' required={mode === 'edit'} />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='member-email'>Email</Label>
                <Input id='member-email' type='email' value={email} onChange={(event) => setEmail(event.target.value)} required disabled={mode === 'edit'} />
              </div>
            </div>

            {editingSelf ? (
              <p className='rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground'>You can&apos;t change your own access. Ask another Owner.</p>
            ) : (
              <>
                {mode === 'invite' && (
                  <div>
                    <p className='mb-2 text-sm font-medium text-navy-950'>Start from a preset</p>
                    <div className='flex flex-wrap gap-2'>
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type='button'
                          onClick={() => {
                            setRole(preset.role)
                            setLevels(preset.levels)
                          }}
                          className='rounded-full border border-border px-3 py-1.5 text-xs font-medium text-navy-800 transition hover:border-navy-400 hover:bg-navy-50'
                          title={preset.description}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-navy-950'>Role</p>
                  <RolePicker value={role} onChange={setRole} allowOwner={me.role === 'SUPERADMIN'} />
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-navy-950'>Access by area</p>
                  <AccessMatrix role={role} levels={levels} onChange={setLevels} maxLevel={(moduleId) => getModuleAccess(me, moduleId)} />
                </div>
              </>
            )}

            <DialogFooter className='gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={mutation.isPending} className='gap-2'>
                {mutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : mode === 'invite' ? <Mail className='h-4 w-4' /> : <Check className='h-4 w-4' />}
                {mode === 'invite' ? 'Send invitation' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PasswordDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const mutation = useMutation({
    mutationFn: () => api(`/api/admin/users/${member.id}`, { method: 'PATCH', body: JSON.stringify({ password }) }),
    onSuccess: () => {
      toast.success(`Password changed for ${member.name}`)
      onClose()
    },
    onError: (error: Error) => toast.error(error.message),
  })
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='w-[calc(100%-2rem)] max-w-md'>
        <form
          className='space-y-5'
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>Set a new password</DialogTitle>
            <DialogDescription>{member.name} will be signed out everywhere and must use the new password.</DialogDescription>
          </DialogHeader>
          <div className='space-y-1.5'>
            <Label htmlFor='new-password'>New password</Label>
            <Input id='new-password' type='text' autoComplete='new-password' value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} required />
            <p className='text-xs text-muted-foreground'>At least 10 characters, with letters and numbers.</p>
          </div>
          <DialogFooter className='gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Set password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TeamManager() {
  const me = useAdminUser()
  const editable = canEdit(me, 'team')
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'members' | 'invites'>('members')
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [resetting, setResetting] = useState<Member | null>(null)
  const [inviteLink, setInviteLink] = useState<{ email: string; link: string } | null>(null)

  const team = useQuery({ queryKey: ['admin-team'], queryFn: () => api<TeamResponse>('/api/admin/users') })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-team'] })
  const action = useMutation({
    mutationFn: ({ url, method, body }: { url: string; method: string; body?: unknown; success: string }) =>
      api<{ data?: { link?: string; emailed?: boolean } }>(url, { method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: (payload, variables) => {
      toast.success(variables.success)
      refresh()
      if (payload?.data?.link && !payload.data.emailed) {
        const invite = team.data?.invites.find((item) => variables.url.endsWith(item.id))
        setInviteLink({ email: invite?.email ?? '', link: payload.data.link })
      }
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const members = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (team.data?.data ?? []).filter((member) => !term || `${member.name} ${member.email}`.toLowerCase().includes(term))
  }, [team.data, search])
  const pendingInvites = (team.data?.invites ?? []).filter((invite) => invite.status === 'pending' || invite.status === 'expired')
  const canTouch = (member: Member) => editable && member.id !== me.id && (me.role === 'SUPERADMIN' || member.role !== 'SUPERADMIN')

  return (
    <PageBody>
      <PageHeader
        eyebrow='Organisation'
        title='Team & access'
        description='Invite people to help run DMRC and decide exactly what each person can see and change.'
        actions={
          <>
            <ExportButton dataset='team' />
            {editable && (
              <Button onClick={() => setInviteOpen(true)} className='gap-2'>
                <UserPlus className='h-4 w-4' /> Invite member
              </Button>
            )}
          </>
        }
      />

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div role='tablist' aria-label='Team views' className='inline-flex rounded-lg border border-border bg-white p-1'>
          {(
            [
              ['members', `Members (${team.data?.data.length ?? 0})`],
              ['invites', `Invitations (${pendingInvites.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role='tab'
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition', tab === id ? 'bg-navy-900 text-white' : 'text-muted-foreground hover:text-navy-900')}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'members' && (
          <div className='relative sm:w-72'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Search by name or email' className='pl-9' aria-label='Search members' />
          </div>
        )}
      </div>

      {team.isLoading ? (
        <Panel>
          <div className='flex items-center justify-center py-16 text-muted-foreground'>
            <Loader2 className='h-5 w-5 animate-spin' />
          </div>
        </Panel>
      ) : team.isError ? (
        <Panel>
          <EmptyState icon={XCircle} title="Couldn't load the team" description={(team.error as Error).message} action={<Button variant='outline' onClick={refresh}>Try again</Button>} />
        </Panel>
      ) : tab === 'members' ? (
        <Panel bodyClassName='p-0'>
          {members.length ? (
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[720px] text-sm'>
                <thead>
                  <tr className='border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                    <th className='px-5 py-3'>Member</th>
                    <th className='px-5 py-3'>Role</th>
                    <th className='px-5 py-3'>Access</th>
                    <th className='px-5 py-3'>Last sign-in</th>
                    <th className='px-5 py-3'>Status</th>
                    <th className='px-5 py-3'>
                      <span className='sr-only'>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {members.map((member) => (
                    <tr key={member.id} className={cn('transition hover:bg-muted/30', !member.isActive && 'opacity-60')}>
                      <td className='px-5 py-3'>
                        <div className='flex items-center gap-3'>
                          <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-800'>{initials(member.name)}</span>
                          <div className='min-w-0'>
                            <p className='truncate font-medium text-navy-950'>
                              {member.name}
                              {member.id === me.id && <span className='ml-2 text-xs font-normal text-muted-foreground'>(you)</span>}
                            </p>
                            <p className='truncate text-xs text-muted-foreground'>{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-3'>
                        <Badge className={roleBadge[member.role]}>{ROLE_LABELS[member.role]}</Badge>
                      </td>
                      <td className='px-5 py-3 text-muted-foreground'>{accessSummary(member.role, member.allowedModules)}</td>
                      <td className='px-5 py-3 text-muted-foreground'>{member.lastLoginAt ? relativeTime(member.lastLoginAt) : 'Never'}</td>
                      <td className='px-5 py-3'>
                        {member.isActive ? <Badge variant='success'>Active</Badge> : <Badge variant='outline'>Deactivated</Badge>}
                      </td>
                      <td className='px-5 py-3 text-right'>
                        {canTouch(member) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon' aria-label={`Actions for ${member.name}`}>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-52'>
                              <DropdownMenuItem onSelect={() => setEditing(member)}>
                                <ShieldCheck className='mr-2 h-4 w-4' /> Edit access
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setResetting(member)}>
                                <KeyRound className='mr-2 h-4 w-4' /> Set new password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  action.mutate({
                                    url: `/api/admin/users/${member.id}`,
                                    method: 'PATCH',
                                    body: { isActive: !member.isActive },
                                    success: member.isActive ? `${member.name} deactivated` : `${member.name} reactivated`,
                                  })
                                }
                              >
                                <Power className='mr-2 h-4 w-4' /> {member.isActive ? 'Deactivate' : 'Reactivate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-rose-600 focus:text-rose-700'
                                onSelect={() => {
                                  if (window.confirm(`Remove ${member.name} from the team? This cannot be undone.`)) {
                                    action.mutate({ url: `/api/admin/users/${member.id}`, method: 'DELETE', success: `${member.name} removed` })
                                  }
                                }}
                              >
                                <Trash2 className='mr-2 h-4 w-4' /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Users2} title='No members match that search' />
          )}
        </Panel>
      ) : (
        <Panel bodyClassName='p-0'>
          {pendingInvites.length ? (
            <ul className='divide-y divide-border'>
              {pendingInvites.map((invite) => (
                <li key={invite.id} className='flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center'>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium text-navy-950'>{invite.name ? `${invite.name} · ${invite.email}` : invite.email}</p>
                    <p className='text-xs text-muted-foreground'>
                      {ROLE_LABELS[invite.role]} · {accessSummary(invite.role, invite.allowedModules)} · invited {relativeTime(invite.createdAt)}
                      {invite.invitedBy ? ` by ${invite.invitedBy}` : ''}
                    </p>
                  </div>
                  {invite.status === 'expired' ? <Badge variant='outline'>Expired</Badge> : <Badge variant='warning'>Expires {relativeTime(invite.expiresAt)}</Badge>}
                  {editable && (
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='gap-1.5'
                        disabled={action.isPending}
                        onClick={() => action.mutate({ url: `/api/admin/invites/${invite.id}`, method: 'POST', success: 'Invitation sent again' })}
                      >
                        <RefreshCw className='h-3.5 w-3.5' /> Resend
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        disabled={action.isPending}
                        onClick={() => action.mutate({ url: `/api/admin/invites/${invite.id}`, method: 'DELETE', success: 'Invitation cancelled' })}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Mail}
              title='No open invitations'
              description='Invite someone and they will appear here until they accept.'
              action={editable ? <Button onClick={() => setInviteOpen(true)}>Invite member</Button> : undefined}
            />
          )}
        </Panel>
      )}

      {inviteOpen && <AccessDialog mode='invite' open onOpenChange={setInviteOpen} />}
      {editing && <AccessDialog key={editing.id} mode='edit' member={editing} open onOpenChange={(open) => !open && setEditing(null)} />}
      {resetting && <PasswordDialog member={resetting} onClose={() => setResetting(null)} />}
      {inviteLink && (
        <Dialog open onOpenChange={(open) => !open && setInviteLink(null)}>
          <DialogContent className='w-[calc(100%-2rem)] max-w-lg'>
            <DialogHeader>
              <DialogTitle>New invitation link</DialogTitle>
              <DialogDescription>Email isn&apos;t set up, so send this link to {inviteLink.email} yourself.</DialogDescription>
            </DialogHeader>
            <CopyLink link={inviteLink.link} />
          </DialogContent>
        </Dialog>
      )}
    </PageBody>
  )
}
