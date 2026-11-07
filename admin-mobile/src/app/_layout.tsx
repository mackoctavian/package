import { CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond/500Medium_Italic';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastHost } from '@/components/admin';
import { ApiError } from '@/lib/api';
import { refreshProfile } from '@/lib/queries';
import { session, useSession } from '@/lib/session';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 400, fade: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && count < 2,
    },
  },
});

// Refetch stale data when the app comes back to the foreground.
AppState.addEventListener('change', (status) => {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
});

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.ivory, card: colors.ivory, primary: colors.navy900, text: colors.ink, border: colors.border },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hydrated = useSession((s) => s.hydrated);
  const signedIn = useSession((s) => Boolean(s.token && s.user));

  useEffect(() => {
    session.hydrate();
  }, []);

  // Pick up access changes made on the web panel each time the app opens.
  useEffect(() => {
    if (hydrated && signedIn) refreshProfile().catch(() => undefined);
  }, [hydrated, signedIn]);

  useEffect(() => {
    if (!signedIn) queryClient.clear();
  }, [signedIn]);

  const ready = (fontsLoaded || Boolean(fontError)) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={theme}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ivory }, animation: 'slide_from_right' }}>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
            </Stack.Protected>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
            </Stack.Protected>
          </Stack>
          <ToastHost />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
