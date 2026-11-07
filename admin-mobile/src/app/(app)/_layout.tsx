import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** Everything behind sign-in. The root layout only shows this group to a signed-in admin. */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ivory }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="content/edit" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="invite" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
