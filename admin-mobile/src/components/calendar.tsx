import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { colors, fonts, radius, space } from '@/theme';
import { Icon, Text } from './ui';

const pad = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Month grid for picking a date range (or one day). Values are YYYY-MM-DD.
 * First tap sets the start, second tap the end.
 */
export function RangeCalendar({
  start,
  end,
  onChange,
}: {
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
}) {
  const initial = start ? new Date(`${start}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const first = new Date(cursor.y, cursor.m, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const today = (() => {
    const now = new Date();
    return key(now.getFullYear(), now.getMonth(), now.getDate());
  })();
  const cells: (number | null)[] = [...Array.from({ length: offset }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const move = (delta: number) => {
    haptic.select();
    setCursor(({ y, m }) => {
      const next = new Date(y, m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });
  };

  const pick = (value: string) => {
    haptic.select();
    if (!start || (start && end) || value < start) onChange(value, null);
    else onChange(start, value);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={() => move(-1)} hitSlop={10} accessibilityLabel="Previous month">
          <Icon name="chevron-back" size={20} color={colors.navy700} />
        </Pressable>
        <Text variant="subtitle">{first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</Text>
        <Pressable onPress={() => move(1)} hitSlop={10} accessibilityLabel="Next month">
          <Icon name="chevron-forward" size={20} color={colors.navy700} />
        </Pressable>
      </View>
      <View style={styles.row}>
        {WEEKDAYS.map((day, index) => (
          <Text key={index} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <View key={week} style={styles.row}>
          {cells.slice(week * 7, week * 7 + 7).map((day, index) => {
            if (!day) return <View key={index} style={styles.cell} />;
            const value = key(cursor.y, cursor.m, day);
            const isEdge = value === start || value === end;
            const inRange = start && end && value > start && value < end;
            return (
              <Pressable key={index} onPress={() => pick(value)} style={[styles.cell, inRange && styles.inRange]} accessibilityRole="button" accessibilityState={{ selected: isEdge }}>
                <View style={[styles.day, isEdge && styles.edge, value === today && !isEdge && styles.today]}>
                  <Text style={[styles.dayText, isEdge && { color: colors.white }]}>{day}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: space.md, gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.sm, paddingBottom: space.sm },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 11, color: colors.subtle, paddingBottom: 4 },
  cell: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  inRange: { backgroundColor: colors.gold50 },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  edge: { backgroundColor: colors.navy900 },
  today: { borderWidth: 1, borderColor: colors.gold400 },
  dayText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
});
