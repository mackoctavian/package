import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { compactTZS, monthLabel } from '@/lib/format';
import { colors, space } from '@/theme';
import { Text } from './ui';

/** Small monthly bar chart for giving. The current month is highlighted in gold. */
export function MonthBars({ data, height = 120, dark = false }: { data: { month: string; total: number }[]; height?: number; dark?: boolean }) {
  const max = Math.max(1, ...data.map((item) => item.total));
  return (
    <View style={{ gap: space.sm }}>
      <View style={[styles.bars, { height }]}>
        {data.map((item, index) => {
          const last = index === data.length - 1;
          const ratio = item.total / max;
          return (
            <View key={item.month} style={styles.col} accessible accessibilityLabel={`${monthLabel(item.month)}: ${compactTZS(item.total)}`}>
              {last && item.total > 0 ? (
                <Text variant="small" style={[styles.value, dark && { color: colors.gold300 }]} numberOfLines={1}>
                  {compactTZS(item.total).replace('TZS ', '')}
                </Text>
              ) : null}
              <Animated.View
                entering={FadeIn.delay(index * 60)}
                style={[styles.bar, { height: Math.max(4, ratio * (height - 22)), backgroundColor: last ? colors.gold400 : dark ? 'rgba(255,255,255,0.16)' : colors.navy200 }]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((item) => (
          <Text key={item.month} variant="small" style={[styles.label, dark && { color: colors.navy300 }]}>
            {monthLabel(item.month)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', borderRadius: 8 },
  value: { fontSize: 10.5, color: colors.gold700 },
  labels: { flexDirection: 'row', gap: 10 },
  label: { flex: 1, textAlign: 'center', fontSize: 11 },
});
