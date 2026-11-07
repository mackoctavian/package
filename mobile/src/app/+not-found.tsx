import { router } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { ScreenHeader } from '@/components/headers';
import { colors } from '@/theme';

export default function NotFound() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScreenHeader title="Not found" />
      <EmptyState icon="compass-outline" title="This page does not exist" action="Go home" onAction={() => router.replace('/')} />
    </View>
  );
}
