import { router } from 'expo-router';
import { View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { ScreenHeader } from '@/components/headers';
import { useT } from '@/i18n';
import { colors } from '@/theme';

export default function NotFound() {
  const t = useT();
  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScreenHeader title={t('notFound.title')} />
      <EmptyState icon="compass-outline" title={t('notFound.text')} action={t('notFound.home')} onAction={() => router.replace('/')} />
    </View>
  );
}
