import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { haptic } from '@/lib/haptics';
import { colors, radius, shadow, space } from '@/theme';
import { Badge, CrossMark, Icon, Text } from './ui';

export const bookingStatusTone = (status?: string) =>
  status === 'approved' ? 'success' : status === 'cancelled' ? 'danger' : status === 'rescheduled' ? 'navy' : 'warning';

export const paymentLabel = (status?: string) =>
  ({ paid: 'Paid', waived: 'No payment needed', refunded: 'Refunded', pending: 'Payment pending' })[status ?? 'pending'] ?? status ?? '';

/** Boarding-pass style retreat ticket; the QR code holds the ticket code scanned at check-in. */
export function TicketCard({
  code,
  retreatTitle,
  dateRange,
  fullName,
  status,
  paymentStatus,
  guests = 0,
}: {
  code: string;
  retreatTitle: string;
  dateRange?: string;
  fullName: string;
  status?: string;
  paymentStatus?: string;
  guests?: number;
}) {
  const cancelled = status === 'cancelled';
  return (
    <View style={[styles.ticket, shadow.lift]}>
      <LinearGradient colors={[colors.navy700, colors.navy950]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.top}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CrossMark size={24} />
            <Text variant="caption" color={colors.gold300}>
              Retreat ticket
            </Text>
          </View>
          {status ? <Badge label={status} tone={bookingStatusTone(status)} /> : null}
        </View>
        <Text variant="title" color={colors.white} style={{ marginTop: space.md }}>
          {retreatTitle}
        </Text>
        {dateRange ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Icon name="calendar-outline" size={14} color={colors.gold200} />
            <Text variant="small" color={colors.navy100}>
              {dateRange}
            </Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.perforation}>
        <View style={[styles.notch, { left: -12 }]} />
        <View style={styles.dash} />
        <View style={[styles.notch, { right: -12 }]} />
      </View>

      <View style={styles.bottom}>
        <View style={[styles.qr, cancelled && { opacity: 0.25 }]}>
          <QRCode value={code} size={168} color={colors.navy950} backgroundColor={colors.white} ecl="H" />
        </View>
        <Pressable
          onPress={() => {
            Clipboard.setStringAsync(code).catch(() => undefined);
            haptic.success();
          }}
          style={styles.code}
          accessibilityRole="button"
          accessibilityLabel={`Ticket code ${code}. Tap to copy.`}>
          <Text variant="title" style={{ letterSpacing: 2, fontSize: 24 }}>
            {code}
          </Text>
          <Icon name="copy-outline" size={16} color={colors.gold600} />
        </Pressable>
        <View style={styles.grid}>
          <View style={{ flex: 1 }}>
            <Text variant="small">Retreatant</Text>
            <Text variant="smallStrong" numberOfLines={1}>
              {fullName}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="small">Guests</Text>
            <Text variant="smallStrong">{guests ? `+${guests}` : 'None'}</Text>
          </View>
          {paymentStatus ? (
            <View style={{ flex: 1.2 }}>
              <Text variant="small">Payment</Text>
              <Text variant="smallStrong">{paymentLabel(paymentStatus)}</Text>
            </View>
          ) : null}
        </View>
        <Text variant="small" center style={{ marginTop: space.md }}>
          Show this code at the DMRC reception to check in.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: { borderRadius: radius.xxl, backgroundColor: colors.white },
  top: { padding: space.xl, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl },
  perforation: { height: 24, justifyContent: 'center', backgroundColor: colors.white },
  notch: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.ivory },
  dash: { marginHorizontal: 20, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border },
  bottom: { padding: space.xl, paddingTop: space.sm, alignItems: 'center' },
  qr: { padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  code: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.lg },
  grid: { flexDirection: 'row', gap: space.md, marginTop: space.lg, alignSelf: 'stretch', paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
