import { type ErrorBoundaryProps, Stack } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/admin';

import { colors } from '@/theme';

/** Everything behind sign-in. The root layout only shows this group to a signed-in admin. */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ivory }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="content/edit" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="invite" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="member/edit" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="leave-request" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

/**
 * If a screen throws while rendering, show a retry screen instead of
 * letting the whole app close.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory, paddingTop: insets.top + 40, justifyContent: 'center' }}>
      <ErrorState message={`Something on this screen didn’t work (${error.message}). Please try again.`} onRetry={() => void retry()} />
    </View>
  );
}
