"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTeamMemberSchema,
  updateTeamMemberSchema,
  teamMemberSchema,
  type CreateTeamMemberInput,
  type TeamMember,
  type UpdateTeamMemberInput,
} from '@dashboard/features/users/data/schema'

async function fetchTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch('/api/dashboard/team-members', {
    credentials: 'include',
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to load team members')
  }

  const payload = (await response.json()) as unknown
  return teamMemberSchema.array().parse(payload)
}

async function createTeamMember(input: CreateTeamMemberInput): Promise<TeamMember> {
  const requestBody = createTeamMemberSchema.parse(input)

  const response = await fetch('/api/dashboard/team-members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to create team member')
  }

  const responseData = (await response.json()) as unknown
  return teamMemberSchema.parse(responseData)
}

async function updateTeamMember({
  id,
  input,
}: {
  id: string
  input: UpdateTeamMemberInput
}): Promise<TeamMember> {
  const requestBody = updateTeamMemberSchema.parse(input)

  const response = await fetch(`/api/dashboard/team-members/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to update team member')
  }

  const responseData = (await response.json()) as unknown
  return teamMemberSchema.parse(responseData)
}

async function deleteTeamMember(id: string): Promise<void> {
  const response = await fetch(`/api/dashboard/team-members/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message?.error ?? 'Failed to delete team member')
  }
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: fetchTeamMembers,
  })
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

