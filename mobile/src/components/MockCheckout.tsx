/**
 * DEMO PAYMENT SHEET
 * ------------------
 * DMRC has not chosen a payment provider yet, so this only simulates a
 * checkout. Nothing typed here is sent anywhere or stored, and no money moves.
 * Replace `simulatePayment` with the provider's SDK or hosted checkout
 * (e.g. Pesapal, AzamPay or Selcom) once one is chosen.
 */
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { mobileNetworks } from '@/data/content';
import { formatTZS } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { colors, radius, space } from '@/theme';
import { DemoBanner, ErrorBanner } from './feedback';
import { TextField } from './form';
import { Button, Icon, type IconName, Text } from './ui';

export type PaymentMethod = 'mobile' | 'card' | 'bank';

const simulatePayment = () => new Promise<void>((resolve) => setTimeout(resolve, 1800));

const methods: { id: PaymentMethod; label: string; icon: IconName }[] = [
  { id: 'mobile', label: 'Mobile money', icon: 'phone-portrait-outline' },
  { id: 'card', label: 'Card', icon: 'card-outline' },
  { id: 'bank', label: 'Bank', icon: 'business-outline' },
];

export function MockCheckout({
  amount,
  reference,
  description,
  defaultPhone = '',
  onPaid,
  busyLabel,
}: {
  amount: number;
  reference: string;
  description: string;
  defaultPhone?: string;
  onPaid: (method: PaymentMethod) => Promise<void> | void;
  busyLabel?: string;
}) {
  const [method, setMethod] = useState<PaymentMethod>('mobile');
  const [network, setNetwork] = useState<string>(mobileNetworks[0]);
  const [phone, setPhone] = useState(defaultPhone);
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setError(null);
    if (method === 'mobile' && !/^[0-9+\s-]{9,16}$/.test(phone)) {
      setError('Enter the mobile money number to charge.');
      haptic.error();
      return;
    }
    if (method === 'card' && (card.number.replace(/\D/g, '').length < 12 || !card.expiry || card.cvc.length < 3)) {
      setError('Enter the card details to continue.');
      haptic.error();
      return;
    }
    setProcessing(true);
    try {
      await simulatePayment();
      // Demo card fields are cleared immediately and never leave the device.
      setCard({ number: '', expiry: '', cvc: '' });
      await onPaid(method);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment could not be completed.');
      haptic.error();
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <Animated.View entering={FadeIn} style={styles.processing}>
        <ActivityIndicator size="large" color={colors.gold500} />
        <Text variant="heading" center>
          {busyLabel ?? (method === 'mobile' ? 'Waiting for confirmation…' : 'Processing payment…')}
        </Text>
        <Text variant="small" center>
          {method === 'mobile' ? `A real checkout would send a PIN prompt to ${phone}.` : 'This is a demo; no money is moving.'}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.springify()} layout={LinearTransition} style={{ gap: space.lg }}>
      <DemoBanner />

      <View style={styles.summary}>
        <View style={{ flex: 1 }}>
          <Text variant="small" color={colors.navy200}>
            {description}
          </Text>
          <Text variant="display" color={colors.white} style={{ marginTop: 4 }}>
            {formatTZS(amount)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="caption" color={colors.gold300} style={{ fontSize: 10 }}>
            Reference
          </Text>
          <Text variant="smallStrong" color={colors.white}>
            {reference}
          </Text>
        </View>
      </View>

      <View style={styles.methods}>
        {methods.map((item) => {
          const active = method === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                haptic.select();
                setMethod(item.id);
                setError(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.method, active && styles.methodActive]}>
              <Icon name={item.icon} size={20} color={active ? colors.white : colors.navy700} />
              <Text variant="smallStrong" color={active ? colors.white : colors.navy700}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {method === 'mobile' ? (
        <Animated.View entering={FadeIn} style={{ gap: space.md }}>
          <View style={styles.networks}>
            {mobileNetworks.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  haptic.select();
                  setNetwork(item);
                }}
                style={[styles.network, network === item && styles.networkActive]}>
                <Text variant="small" color={network === item ? colors.navy900 : colors.muted} style={{ fontSize: 12 }}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextField label="Mobile money number" icon="call-outline" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="07XX XXX XXX" />
        </Animated.View>
      ) : null}

      {method === 'card' ? (
        <Animated.View entering={FadeIn} style={{ gap: space.md }}>
          <TextField
            label="Card number"
            icon="card-outline"
            keyboardType="number-pad"
            value={card.number}
            onChangeText={(value) => setCard((prev) => ({ ...prev, number: value.replace(/[^\d ]/g, '').slice(0, 23) }))}
            placeholder="4242 4242 4242 4242"
            autoComplete="off"
          />
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ flex: 1 }}>
              <TextField label="Expiry" value={card.expiry} onChangeText={(value) => setCard((prev) => ({ ...prev, expiry: value.slice(0, 5) }))} placeholder="MM/YY" autoComplete="off" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="CVC"
                keyboardType="number-pad"
                value={card.cvc}
                onChangeText={(value) => setCard((prev) => ({ ...prev, cvc: value.replace(/\D/g, '').slice(0, 4) }))}
                placeholder="123"
                secureTextEntry
                autoComplete="off"
              />
            </View>
          </View>
          <Text variant="small">Demo only: card details stay on this screen and are cleared after the simulated payment.</Text>
        </Animated.View>
      ) : null}

      {method === 'bank' ? (
        <Animated.View entering={FadeIn} style={styles.bank}>
          <Text variant="smallStrong">Bank transfer details</Text>
          <Text variant="small">Account details will appear here once DMRC confirms its banking information. Use this reference so the office can match your transfer:</Text>
          <Pressable
            onPress={() => {
              Clipboard.setStringAsync(reference).catch(() => undefined);
              haptic.success();
            }}
            style={styles.copy}>
            <Text variant="bodyStrong">{reference}</Text>
            <Icon name="copy-outline" size={16} color={colors.gold600} />
          </Pressable>
        </Animated.View>
      ) : null}

      <ErrorBanner message={error} />

      <Button
        label={method === 'bank' ? 'I have made the transfer' : `Pay ${formatTZS(amount)}`}
        icon="lock-closed"
        variant="gold"
        onPress={pay}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  processing: { alignItems: 'center', gap: space.md, paddingVertical: 56 },
  summary: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.navy900,
    alignItems: 'flex-end',
  },
  methods: { flexDirection: 'row', gap: space.sm },
  method: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  methodActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  networks: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  network: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  networkActive: { borderColor: colors.gold400, backgroundColor: colors.gold50 },
  bank: { gap: space.sm, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  copy: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.gold50,
    borderWidth: 1,
    borderColor: colors.gold100,
  },
});
