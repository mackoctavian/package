import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { EmptyState, ErrorBanner } from '@/components/feedback';
import { TextField } from '@/components/form';
import { ScreenHeader } from '@/components/headers';
import { Button, Card, CrossMark, Icon, PressableScale, Text } from '@/components/ui';
import { lookupBooking } from '@/lib/api';
import { useFormat, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { actions, useAppStore } from '@/lib/store';
import { colors, radius, space } from '@/theme';

export default function TicketsScreen() {
  const tickets = useAppStore((s) => s.tickets);
  const t = useT();
  const { date } = useFormat();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = async () => {
    const value = code.trim();
    if (!value) {
      setError(t('tickets.enterCode'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await lookupBooking(value);
      const ticketCode = data.ticketCode ?? value.toUpperCase();
      actions.saveTicket({
        code: ticketCode,
        bookingId: data.id,
        retreatTitle: data.retreatTitle,
        fullName: data.fullName,
        savedAt: new Date().toISOString(),
      });
      haptic.success();
      setCode('');
      router.push({ pathname: '/ticket/[code]', params: { code: ticketCode } });
    } catch (err) {
      haptic.error();
      setError(err instanceof Error ? err.message : t('tickets.notFound'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScreenHeader title={t('tickets.title')} />
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.code}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 60 }}
        ListHeaderComponent={
          <Card style={{ gap: space.md, marginBottom: space.lg }}>
            <Text variant="subtitle">{t('tickets.findTitle')}</Text>
            <Text variant="small">{t('tickets.findText')}</Text>
            <TextField
              label={t('tickets.code')}
              icon="ticket-outline"
              autoCapitalize="characters"
              value={code}
              onChangeText={setCode}
              placeholder="DMRC-XXXXXXXX"
              returnKeyType="search"
              onSubmitEditing={find}
            />
            <ErrorBanner message={error} />
            <Button label={t('tickets.find')} icon="search" size="md" loading={loading} onPress={find} />
          </Card>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()} layout={LinearTransition}>
            <PressableScale onPress={() => router.push({ pathname: '/ticket/[code]', params: { code: item.code } })} style={styles.row} accessibilityRole="button">
              <View style={styles.stub}>
                <CrossMark size={28} />
              </View>
              <View style={{ flex: 1, padding: space.lg, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {item.retreatTitle}
                </Text>
                <Text variant="small">{item.dateRange || t('tickets.saved', { date: date(item.savedAt, { day: 'numeric', month: 'short' }) })}</Text>
                <Text variant="smallStrong" color={colors.gold700} style={{ letterSpacing: 1 }}>
                  {item.code}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.subtle} style={{ marginRight: space.lg }} />
            </PressableScale>
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState icon="ticket-outline" title={t('tickets.emptyTitle')} body={t('tickets.emptyText')} action={t('retreats.browse')} onAction={() => router.push('/retreats')} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
  stub: { width: 72, alignSelf: 'stretch', backgroundColor: colors.navy900, alignItems: 'center', justifyContent: 'center' },
});
