import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { colors, fonts, radius, space } from '@/theme';
import { Icon, type IconName, Text } from './ui';

export function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">
        {label}
        {required ? <Text variant="label" color={colors.gold600}> *</Text> : null}
      </Text>
      {children}
      {error ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={styles.errorRow}>
          <Icon name="alert-circle" size={14} color={colors.danger} />
          <Text variant="small" color={colors.danger} style={{ flex: 1 }}>
            {error}
          </Text>
        </Animated.View>
      ) : hint ? (
        <Text variant="small">{hint}</Text>
      ) : null}
    </View>
  );
}

export function TextField({
  label,
  required,
  hint,
  error,
  icon,
  style,
  ...props
}: TextInputProps & { label: string; required?: boolean; hint?: string; error?: string; icon?: IconName }) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <View style={[styles.input, props.multiline && styles.multiline, focused && styles.inputFocused, error ? styles.inputError : null]}>
        {icon ? <Icon name={icon} size={18} color={focused ? colors.gold600 : colors.subtle} /> : null}
        <TextInput
          placeholderTextColor={colors.subtle}
          selectionColor={colors.gold500}
          {...props}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[styles.textInput, props.multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 14 }, style]}
          accessibilityLabel={label}
        />
      </View>
    </Field>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  labelFor,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Display text for an option; the value itself (often stored English) stays unchanged. */
  labelFor?: (option: T) => string;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => {
              haptic.select();
              onChange(option);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}>
            <Text variant="smallStrong" color={active ? colors.white : colors.navy700}>
              {labelFor ? labelFor(option) : option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Checkbox({ checked, onChange, label, error }: { checked: boolean; onChange: (value: boolean) => void; label: ReactNode; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        onPress={() => {
          haptic.select();
          onChange(!checked);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={[styles.checkRow, checked && styles.checkRowActive, error ? styles.inputError : null]}>
        <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
          {checked ? <Icon name="checkmark" size={15} color={colors.white} /> : null}
        </View>
        <View style={{ flex: 1 }}>{typeof label === 'string' ? <Text variant="body">{label}</Text> : label}</View>
      </Pressable>
      {error ? (
        <Text variant="small" color={colors.danger}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, compact }: { value: number; onChange: (value: number) => void; min?: number; max?: number; compact?: boolean }) {
  const t = useT();
  const size = compact ? 32 : 44;
  const button = (icon: IconName, next: number, disabled: boolean, label: string) => (
    <Pressable
      disabled={disabled}
      onPress={() => {
        haptic.select();
        onChange(next);
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.stepButton, { width: size, height: size, opacity: disabled ? 0.35 : 1 }]}>
      <Icon name={icon} size={compact ? 16 : 20} color={colors.ink} />
    </Pressable>
  );
  return (
    <View style={styles.stepper}>
      {button('remove', value - 1, value <= min, t('common.decrease'))}
      <Text variant="subtitle" style={{ minWidth: compact ? 24 : 36, textAlign: 'center' }}>
        {value}
      </Text>
      {button('add', value + 1, value >= max, t('common.increase'))}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  multiline: { alignItems: 'flex-start' },
  inputFocused: { borderColor: colors.gold400, backgroundColor: colors.gold50 },
  inputError: { borderColor: colors.danger },
  textInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  segmented: { flexDirection: 'row', backgroundColor: colors.navy50, borderRadius: radius.md, padding: 4, gap: 4 },
  segment: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.navy900 },
  checkRow: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'flex-start',
  },
  checkRowActive: { borderColor: colors.gold300, backgroundColor: colors.gold50 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.navy300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkBoxActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.navy50, borderRadius: radius.pill, padding: 4 },
  stepButton: { borderRadius: radius.pill, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
});
