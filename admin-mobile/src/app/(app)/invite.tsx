import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccessEditor, grantsFromLevels, type Levels, ROLE_INFO } from '@/components/access';
import { IconButton, ListSkeleton, SegmentTabs, toast } from '@/components/admin';
import { ErrorBanner } from '@/components/feedback';
import { TextField } from '@/components/form';
import { Button, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { keys } from '@/lib/queries';
import { useSession } from '@/lib/session';
import type { AdminRole, ModuleInfo } from '@/lib/types';
import { colors, space } from '@/theme';

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const me = useSession((s) => s.user);
  const client = useQueryClient();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AdminRole>('EDITOR');
  const [levels, setLevels] = useState<Levels>({ overview: 'view' });
  const [error, setError] = useState<string | null>(null);

  const team = useQuery({ queryKey: keys.team, queryFn: ({ signal }) => api<{ modules: ModuleInfo[] }>('/api/admin/users', { signal }) });

  const send = useMutation({
    mutationFn: () =>
      api<{ data: { link: string; emailed: boolean; emailError: string | null } }>('/api/admin/invites', {
        method: 'POST',
        body: { email: email.trim(), name: name.trim(), role, allowedModules: role === 'SUPERADMIN' ? [] : grantsFromLevels(levels) },
      }),
    onSuccess: async (response) => {
      if (response.data.emailed) toast(`Invitation emailed to ${email.trim()}`);
      else {
        await Clipboard.setStringAsync(response.data.link);
        toast('Email is not set up, so the invite link was copied. Send it to them yourself.', 'info');
      }
      client.invalidateQueries({ queryKey: keys.team });
      router.back();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const roles: AdminRole[] = me?.role === 'SUPERADMIN' ? ['EDITOR', 'VIEWER', 'SUPERADMIN'] : ['EDITOR', 'VIEWER'];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ivory }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? space.lg : insets.top + space.sm }]}>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
        <Text variant="subtitle" style={{ flex: 1, textAlign: 'center' }}>
          Invite to the team
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
        <ErrorBanner message={error} />
        <TextField label="Email" required icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <TextField label="Name" icon="person-outline" value={name} onChangeText={setName} hint="Optional, used in the invitation email." />
        <View style={{ gap: space.sm }}>
          <Text variant="label">Role</Text>
          <SegmentTabs value={role} onChange={setRole} options={roles.map((value) => ({ value, label: ROLE_INFO[value].label }))} />
          <Text variant="small">{ROLE_INFO[role].description}</Text>
        </View>
        {role !== 'SUPERADMIN' ? (
          team.data ? (
            <AccessEditor modules={team.data.modules} levels={levels} onChange={setLevels} role={role} actor={me} />
          ) : (
            <ListSkeleton rows={4} />
          )
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label="Send invitation" icon="paper-plane" loading={send.isPending} disabled={!email.trim()} onPress={() => send.mutate()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingTop: space.md, backgroundColor: colors.ivory, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
