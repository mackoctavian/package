import { Pressable, StyleSheet, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { accessLevel } from '@/lib/session';
import type { AccessLevel, AdminProfile, AdminRole, ModuleId, ModuleInfo } from '@/lib/types';
import { colors, fonts, radius, space } from '@/theme';
import { Text } from './ui';

export type Levels = Partial<Record<ModuleId, AccessLevel | 'none'>>;

export const ROLE_INFO: Record<AdminRole, { label: string; description: string }> = {
  SUPERADMIN: { label: 'Owner', description: 'Full access to everything, including team and access settings.' },
  EDITOR: { label: 'Manager', description: 'Can view or edit the areas you choose.' },
  VIEWER: { label: 'Viewer', description: 'Read-only access to the areas you choose.' },
};

/** Reads stored grants such as "news:edit" into a level per area. */
export const levelsFromGrants = (grants: string[], role: AdminRole): Levels => {
  const levels: Levels = {};
  for (const grant of grants) {
    const [id, level] = grant.split(':') as [ModuleId, string | undefined];
    const value: AccessLevel = level === 'edit' || level === 'view' ? level : role === 'VIEWER' ? 'view' : 'edit';
    if (levels[id] !== 'edit') levels[id] = value;
  }
  return levels;
};

export const grantsFromLevels = (levels: Levels) =>
  Object.entries(levels)
    .filter(([, level]) => level && level !== 'none')
    .map(([id, level]) => `${id}:${level}`);

/**
 * One row per area with None / View / Edit. Mirrors the web panel: people can
 * only hand out access they hold themselves, and Viewers never get Edit.
 */
export function AccessEditor({
  modules,
  levels,
  onChange,
  role,
  actor,
  disabled,
}: {
  modules: ModuleInfo[];
  levels: Levels;
  onChange: (levels: Levels) => void;
  role: AdminRole;
  actor: AdminProfile | null;
  disabled?: boolean;
}) {
  const groups = Array.from(new Set(modules.map((module) => module.group)));
  return (
    <View style={{ gap: space.lg }}>
      {groups.map((group) => (
        <View key={group} style={{ gap: space.sm }}>
          <Text variant="caption">{group}</Text>
          <View style={styles.card}>
            {modules
              .filter((module) => module.group === group)
              .map((module, index) => {
                const held = accessLevel(actor, module.id);
                const current = module.id === 'overview' ? 'view' : (levels[module.id] ?? 'none');
                const options: (AccessLevel | 'none')[] = module.id === 'overview' ? ['view'] : role === 'VIEWER' ? ['none', 'view'] : ['none', 'view', 'edit'];
                return (
                  <View key={module.id} style={[styles.row, index > 0 && styles.divider]}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                        {module.label}
                      </Text>
                      <Text variant="small" numberOfLines={2} style={{ fontSize: 12 }}>
                        {module.description}
                      </Text>
                    </View>
                    <View style={styles.levels}>
                      {options.map((option) => {
                        const allowed = option === 'none' || held === 'edit' || (option === 'view' && held === 'view');
                        const active = current === option;
                        return (
                          <Pressable
                            key={option}
                            disabled={disabled || !allowed || module.id === 'overview'}
                            onPress={() => {
                              haptic.select();
                              onChange({ ...levels, [module.id]: option });
                            }}
                            style={[styles.level, active && (option === 'edit' ? styles.levelEdit : option === 'view' ? styles.levelView : styles.levelNone), !allowed && { opacity: 0.35 }]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active, disabled: !allowed }}
                            accessibilityLabel={`${module.label}: ${option}`}>
                            <Text style={[styles.levelText, active && { color: option === 'none' ? colors.muted : option === 'edit' ? colors.navy950 : colors.white }]}>
                              {option === 'none' ? 'Off' : option === 'view' ? 'View' : 'Edit'}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  levels: { flexDirection: 'row', padding: 3, borderRadius: radius.pill, backgroundColor: colors.parchment, gap: 2 },
  level: { paddingHorizontal: 10, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  levelNone: { backgroundColor: colors.white },
  levelView: { backgroundColor: colors.navy700 },
  levelEdit: { backgroundColor: colors.gold400 },
  levelText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
});
