import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@/theme';
import { Text } from './ui';

/** Large editorial title used at the top of tab screens. */
export function TabHeader({ eyebrow, title, right, children }: { eyebrow?: string; title: string; right?: ReactNode; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + space.md }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {eyebrow ? <Text variant="caption">{eyebrow}</Text> : null}
          <Text variant="display" style={{ marginTop: 4 }}>
            {title}
          </Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.xl, paddingBottom: space.md, backgroundColor: colors.ivory, gap: space.lg },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
});
