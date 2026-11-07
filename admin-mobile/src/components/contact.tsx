import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { colors, radius, space } from '@/theme';
import { Icon, type IconName, Text } from './ui';

const digits = (phone: string) => phone.replace(/[^\d+]/g, '');
const whatsappNumber = (phone: string) => {
  const value = digits(phone).replace(/^\+/, '');
  // Local Tanzanian numbers (07…/06…) become 2557…
  return value.startsWith('0') ? `255${value.slice(1)}` : value;
};

/** Call, WhatsApp and email shortcuts for a guest, donor or sender. */
export function ContactBar({ phone, whatsapp, email }: { phone?: string | null; whatsapp?: string | null; email?: string | null }) {
  const actions = [
    phone && { icon: 'call' as IconName, label: 'Call', url: `tel:${digits(phone)}` },
    (whatsapp || phone) && { icon: 'logo-whatsapp' as IconName, label: 'WhatsApp', url: `https://wa.me/${whatsappNumber(whatsapp || phone || '')}` },
    phone && { icon: 'chatbubble' as IconName, label: 'SMS', url: `sms:${digits(phone)}` },
    email && { icon: 'mail' as IconName, label: 'Email', url: `mailto:${email}` },
  ].filter(Boolean) as { icon: IconName; label: string; url: string }[];
  if (!actions.length) return null;
  return (
    <View style={styles.bar}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
          onPress={() => {
            haptic.tap();
            Linking.openURL(action.url).catch(() => undefined);
          }}
          accessibilityRole="button"
          accessibilityLabel={action.label}>
          <View style={styles.icon}>
            <Icon name={action.icon} size={18} color={colors.navy800} />
          </View>
          <Text variant="small" color={colors.ink} style={{ fontSize: 12 }}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: space.sm },
  button: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: space.md, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.navy50, alignItems: 'center', justifyContent: 'center' },
});
