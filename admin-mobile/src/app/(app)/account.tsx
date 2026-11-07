import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Avatar, StackHeader, toast } from '@/components/admin';
import { ErrorBanner } from '@/components/feedback';
import { TextField } from '@/components/form';
import { Button, Card, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { refreshProfile } from '@/lib/queries';
import { useSession } from '@/lib/session';
import { space } from '@/theme';

export default function Account() {
  const user = useSession((s) => s.user);
  const [name, setName] = useState(user?.name ?? '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);

  const saveName = useMutation({
    mutationFn: () => api('/api/admin/account', { method: 'PATCH', body: { name: name.trim() } }),
    onSuccess: async () => {
      await refreshProfile().catch(() => undefined);
      toast('Name updated');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  const savePassword = useMutation({
    mutationFn: async () => {
      if (next !== repeat) throw new Error('The new passwords do not match.');
      return api('/api/admin/account', { method: 'PATCH', body: { currentPassword: current, newPassword: next } });
    },
    onSuccess: () => {
      setCurrent('');
      setNext('');
      setRepeat('');
      setError(null);
      toast('Password changed');
    },
    onError: (err) => setError(errorMessage(err)),
  });

  if (!user) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StackHeader title="Your account" />
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <Avatar name={user.name} size={76} tone="gold" />
          <Text variant="title">{user.name}</Text>
          <Text variant="small">
            {user.roleLabel} · {user.email}
          </Text>
        </View>
        <Card style={{ gap: space.md }}>
          <TextField label="Display name" value={name} onChangeText={setName} />
          <Button label="Save name" size="md" variant="secondary" disabled={!name.trim() || name.trim() === user.name} loading={saveName.isPending} onPress={() => saveName.mutate()} />
        </Card>
        <Card style={{ gap: space.md }}>
          <Text variant="subtitle">Change password</Text>
          <ErrorBanner message={error} />
          <TextField label="Current password" secureTextEntry value={current} onChangeText={setCurrent} autoComplete="current-password" />
          <TextField label="New password" secureTextEntry value={next} onChangeText={setNext} hint="At least 10 characters, with letters and numbers." autoComplete="new-password" />
          <TextField label="Repeat new password" secureTextEntry value={repeat} onChangeText={setRepeat} autoComplete="new-password" />
          <Button label="Change password" size="md" disabled={!current || !next} loading={savePassword.isPending} onPress={() => savePassword.mutate()} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
