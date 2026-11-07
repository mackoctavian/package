import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { AccessEditor, grantsFromLevels, type Levels, levelsFromGrants, ROLE_INFO } from '@/components/access';
import {
  Avatar,
  confirm,
  ErrorState,
  Group,
  IconButton,
  ListRow,
  ListSkeleton,
  RowDivider,
  SegmentTabs,
  Sheet,
  SheetOption,
  StackHeader,
  StatusPill,
  toast,
  ViewOnlyNote,
} from '@/components/admin';
import { Button, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import { keys } from '@/lib/queries';
import { useCan, useSession } from '@/lib/session';
import type { AdminRole, Invite, ModuleInfo, TeamMember } from '@/lib/types';
import { colors, space } from '@/theme';

type TeamResponse = { data: TeamMember[]; invites: Invite[]; modules: ModuleInfo[] };

export default function Team() {
  const me = useSession((s) => s.user);
  const canEdit = useCan('team', 'edit');
  const client = useQueryClient();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [editing, setEditing] = useState<{ role: AdminRole; levels: Levels } | null>(null);

  const query = useQuery({ queryKey: keys.team, queryFn: ({ signal }) => api<TeamResponse>('/api/admin/users', { signal }) });
  const refresh = () => client.invalidateQueries({ queryKey: keys.team });

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/api/admin/users/${member?.id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      toast('Team member updated');
      setMember(null);
      setEditing(null);
      refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const inviteAction = useMutation({
    mutationFn: (action: 'resend' | 'revoke') =>
      action === 'resend' ? api<{ data?: { link?: string; emailed?: boolean } }>(`/api/admin/invites/${invite?.id}`, { method: 'POST' }) : api(`/api/admin/invites/${invite?.id}`, { method: 'DELETE' }),
    onSuccess: async (response, action) => {
      const data = (response as { data?: { link?: string; emailed?: boolean } } | undefined)?.data;
      if (action === 'resend' && data?.link && !data.emailed) {
        await Clipboard.setStringAsync(data.link);
        toast('Email is not set up, so the invite link was copied');
      } else toast(action === 'resend' ? 'Invitation sent again' : 'Invitation withdrawn');
      setInvite(null);
      refresh();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const members = query.data?.data ?? [];
  const invites = (query.data?.invites ?? []).filter((item) => item.status === 'pending' || item.status === 'expired');
  const modules = query.data?.modules ?? [];
  const areaCount = (item: { role: AdminRole; allowedModules: string[] }) => (item.role === 'SUPERADMIN' ? 'Everything' : `${item.allowedModules.length} areas`);

  return (
    <View style={{ flex: 1 }}>
      <StackHeader
        title="Team & access"
        subtitle={`${members.filter((item) => item.isActive).length} active members`}
        right={canEdit ? <IconButton icon="person-add" label="Invite someone" tone="dark" onPress={() => router.push('/invite')} /> : null}
      />
      {query.isLoading ? (
        <ListSkeleton />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}>
          {!canEdit ? <ViewOnlyNote /> : null}
          {invites.length ? (
            <Group title="Invitations">
              {invites.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <RowDivider /> : null}
                  <ListRow
                    title={item.name || item.email}
                    subtitle={`${ROLE_INFO[item.role].label} · invited ${relativeTime(item.createdAt)}${item.invitedBy ? ` by ${item.invitedBy}` : ''}`}
                    leading={<Avatar name={item.name || item.email} size={38} tone="gold" />}
                    trailing={<StatusPill status={item.status} />}
                    onPress={canEdit ? () => setInvite(item) : undefined}
                  />
                </View>
              ))}
            </Group>
          ) : null}
          {(['SUPERADMIN', 'EDITOR', 'VIEWER'] as AdminRole[]).map((role) => {
            const people = members.filter((item) => item.role === role);
            if (!people.length) return null;
            return (
              <Group key={role} title={`${ROLE_INFO[role].label}s`}>
                {people.map((item, index) => (
                  <View key={item.id}>
                    {index > 0 ? <RowDivider /> : null}
                    <ListRow
                      title={`${item.name}${item.id === me?.id ? ' (you)' : ''}`}
                      subtitle={item.email}
                      meta={`${areaCount(item)} · ${item.lastLoginAt ? `last seen ${relativeTime(item.lastLoginAt)}` : 'never signed in'}`}
                      leading={<Avatar name={item.name} size={40} />}
                      trailing={!item.isActive ? <StatusPill status="inactive" /> : undefined}
                      onPress={() => setMember(item)}
                    />
                  </View>
                ))}
              </Group>
            );
          })}
        </ScrollView>
      )}

      <Sheet
        visible={Boolean(member) && !editing}
        onClose={() => setMember(null)}
        title={member?.name}>
        {member ? (
          <View style={{ gap: space.sm }}>
            <Text variant="small" style={{ marginBottom: space.sm, marginLeft: space.xs }}>
              {ROLE_INFO[member.role].label} · {member.email}
            </Text>
            {canEdit && member.id !== me?.id && (member.role !== 'SUPERADMIN' || me?.role === 'SUPERADMIN') ? (
              <>
                <SheetOption
                  label="Change role and access"
                  icon="shield-half-outline"
                  onPress={() => setEditing({ role: member.role, levels: levelsFromGrants(member.allowedModules, member.role) })}
                />
                <SheetOption
                  label={member.isActive ? 'Deactivate' : 'Reactivate'}
                  description={member.isActive ? 'Signs them out everywhere and blocks sign-in.' : 'Lets them sign in again.'}
                  icon={member.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                  danger={member.isActive}
                  onPress={async () => {
                    if (member.isActive && !(await confirm(`Deactivate ${member.name}?`, 'They will be signed out on every device.', 'Deactivate', true))) return;
                    update.mutate({ isActive: !member.isActive });
                  }}
                />
              </>
            ) : (
              <ViewOnlyNote text={member.id === me?.id ? 'Ask another Owner to change your own access.' : 'You can see this member but not change them.'} />
            )}
          </View>
        ) : null}
      </Sheet>

      <Sheet visible={Boolean(editing)} onClose={() => setEditing(null)} title={`Access for ${member?.name ?? ''}`}>
        {editing && member ? (
          <View style={{ gap: space.lg, paddingBottom: space.md }}>
            <SegmentTabs
              value={editing.role}
              onChange={(role) => setEditing({ ...editing, role })}
              options={(me?.role === 'SUPERADMIN' ? (['SUPERADMIN', 'EDITOR', 'VIEWER'] as AdminRole[]) : (['EDITOR', 'VIEWER'] as AdminRole[])).map((role) => ({ value: role, label: ROLE_INFO[role].label }))}
            />
            <Text variant="small">{ROLE_INFO[editing.role].description}</Text>
            {editing.role !== 'SUPERADMIN' ? (
              <AccessEditor modules={modules} levels={editing.levels} onChange={(levels) => setEditing({ ...editing, levels })} role={editing.role} actor={me} />
            ) : null}
            <Button
              label="Save access"
              loading={update.isPending}
              onPress={() => update.mutate({ role: editing.role, allowedModules: editing.role === 'SUPERADMIN' ? [] : grantsFromLevels(editing.levels) })}
            />
            <Text variant="small" center style={{ fontSize: 12 }}>
              Saving signs {member.name} out so the new access applies straight away.
            </Text>
          </View>
        ) : null}
      </Sheet>

      <Sheet visible={Boolean(invite)} onClose={() => setInvite(null)} title={invite?.email}>
        <SheetOption label="Send the invitation again" icon="paper-plane-outline" description="A fresh link valid for 7 days." onPress={() => inviteAction.mutate('resend')} />
        <SheetOption
          label="Withdraw invitation"
          icon="close-circle-outline"
          danger
          onPress={async () => {
            if (await confirm('Withdraw this invitation?', 'The link in their email will stop working.', 'Withdraw', true)) inviteAction.mutate('revoke');
          }}
        />
      </Sheet>
    </View>
  );
}
