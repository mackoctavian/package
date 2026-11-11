import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { Sheet } from '@/components/admin';
import { ErrorBanner } from '@/components/feedback';
import { TextField } from '@/components/form';
import { Button, Icon, NavyGradient, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { DEFAULT_API_URL, hostOf, normalizeServer, server, useApiUrl } from '@/lib/config';
import { haptic } from '@/lib/haptics';
import { session } from '@/lib/session';
import type { AdminProfile } from '@/lib/types';
import { colors, radius, space } from '@/theme';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = useApiUrl();
  const [serverOpen, setServerOpen] = useState(false);
  const [serverDraft, setServerDraft] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const openServer = () => {
    setServerDraft(hostOf(current));
    setServerError(null);
    setServerOpen(true);
  };

  /** Checks that the address is a DMRC site (its admin API answers in JSON) before saving it. */
  const saveServer = async () => {
    const url = normalizeServer(serverDraft);
    if (!url) {
      setServerError('Enter a web address, like www.example.org');
      return;
    }
    setChecking(true);
    setServerError(null);
    try {
      const response = await fetch(`${url}/api/mobile/admin/session`, { headers: { Accept: 'application/json' } });
      const body = (await response.json().catch(() => null)) as { data?: unknown; error?: unknown } | null;
      if (!body || !('data' in body || 'error' in body)) throw new Error(`${hostOf(url)} doesn’t look like the DMRC website. Use the address you sign in to the web dashboard on.`);
      await server.set(url);
      setError(null);
      setServerOpen(false);
      haptic.success();
    } catch (err) {
      haptic.error();
      setServerError(err instanceof TypeError ? `Couldn’t reach ${hostOf(url)}. Check the address and your internet.` : errorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      haptic.error();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await api<{ data: { token: string; user: AdminProfile } }>('/api/mobile/admin/session', {
        method: 'POST',
        auth: false,
        body: { email: email.trim(), password, device: Constants.deviceName ?? Platform.OS },
      });
      haptic.success();
      await session.signIn(response.data.token, response.data.user);
    } catch (err) {
      haptic.error();
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ivory }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        <NavyGradient style={[styles.hero, { paddingTop: insets.top + 48 }]}>
          <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center', gap: space.md }}>
            <View style={styles.emblemWrap}>
              <Image source={require('@/assets/images/emblem.png')} style={styles.emblem} contentFit="contain" />
            </View>
            <Text variant="caption" color={colors.gold300}>
              Divine Mercy Retreat Center
            </Text>
            <Text variant="hero" color={colors.white} center>
              Admin
            </Text>
            <Text variant="body" color={colors.navy200} center style={{ maxWidth: 300 }}>
              Bookings, check-in, giving and content, wherever you are.
            </Text>
          </Animated.View>
        </NavyGradient>

        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={[styles.card, { paddingBottom: insets.bottom + space.xxl }]}>
          <Text variant="title">Sign in</Text>
          <Text variant="small" style={{ marginTop: -space.sm }}>
            Use the same email and password as the web admin panel.
          </Text>
          <ErrorBanner message={error} />
          <TextField
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="next"
            placeholder="you@dmrc.or.tz"
          />
          <View>
            <TextField
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!reveal}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              placeholder="Your password"
            />
            <Pressable onPress={() => setReveal((value) => !value)} hitSlop={12} style={styles.reveal} accessibilityLabel={reveal ? 'Hide password' : 'Show password'}>
              <Icon name={reveal ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.subtle} />
            </Pressable>
          </View>
          <Button label="Sign in" iconRight="arrow-forward" onPress={submit} loading={busy} style={{ marginTop: space.sm }} />
          <Pressable onPress={openServer} style={styles.server} accessibilityRole="button" accessibilityLabel="Change website address">
            <Icon name="globe-outline" size={16} color={colors.navy600} />
            <Text variant="small" style={{ flex: 1 }} numberOfLines={1}>
              Website: <Text variant="smallStrong">{hostOf(current)}</Text>
            </Text>
            <Text variant="smallStrong" color={colors.gold700}>
              Change
            </Text>
          </Pressable>
          <View style={styles.note}>
            <Icon name="shield-checkmark-outline" size={16} color={colors.navy600} />
            <Text variant="small" style={{ flex: 1 }}>
              New to the team? Accept your invitation from the email first, then sign in here. What you can see depends on the access an Owner gave you.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Sheet visible={serverOpen} onClose={() => setServerOpen(false)} title="Website address">
        <View style={{ gap: space.lg }}>
          <Text variant="small">The DMRC website this app signs in to. Use the address you open the web dashboard on.</Text>
          <ErrorBanner message={serverError} />
          <TextField
            label="Website"
            icon="globe-outline"
            value={serverDraft}
            onChangeText={setServerDraft}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="www.example.org"
            returnKeyType="done"
            onSubmitEditing={saveServer}
          />
          <Button label="Check and save" icon="checkmark" onPress={saveServer} loading={checking} />
          {current !== DEFAULT_API_URL ? (
            <Button
              label={`Reset to ${hostOf(DEFAULT_API_URL)}`}
              variant="ghost"
              onPress={async () => {
                await server.set(null);
                setServerOpen(false);
              }}
            />
          ) : null}
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: space.xxl, paddingBottom: 72, alignItems: 'center' },
  emblemWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  emblem: { width: 60, height: 60 },
  card: {
    flex: 1,
    marginTop: -36,
    backgroundColor: colors.ivory,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: space.xxl,
    gap: space.lg,
  },
  reveal: { position: 'absolute', right: 14, bottom: 15 },
  server: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.navy50,
  },
});
