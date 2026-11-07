import { router } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/feedback';

export default function NotFound() {
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <EmptyState icon="compass-outline" title="Page not found" body="This screen does not exist in the app." action="Go home" onAction={() => router.replace('/')} />
    </View>
  );
}
