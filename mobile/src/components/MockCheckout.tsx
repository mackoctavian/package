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
import { useFormat, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { colors, radius, space } from '@/theme';
import { DemoBanner, ErrorBanner } from './feedback';
import { TextField } from './form';
import { Button, Icon, type IconName, Text } from './ui';

export type PaymentMethod = 'mobile' | 'card' | 'bank';

const simulatePayment = () => new Promise<void>((resolve) => setTimeout(resolve, 1800));

const methods: { id: PaymentMethod; icon: IconName }[] = [
  { id: 'mobile', icon: 'phone-portrait-outline' },
  { id: 'card', icon: 'card-outline' },
  { id: 'bank', icon: 'business-outline' },
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
  const t = useT();
  const { money } = useFormat();
  const [method, setMethod] = useState<PaymentMethod>('mobile');
  const [network, setNetwork] = useState<string>(mobileNetworks[0]);
  const [phone, setPhone] = useState(defaultPhone);
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setError(null);
    if (method === 'mobile' && !/^[0-9+\s-]{9,16}$/.test(phone)) {
      setError(t('checkout.errors.mobile'));
      haptic.error();
      return;
    }
    if (method === 'card' && (card.number.replace(/\D/g, '').length < 12 || !card.expiry || card.cvc.length < 3)) {
      setError(t('checkout.errors.card'));
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
      setError(err instanceof Error ? err.message : t('checkout.errors.failed'));
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
          {busyLabel ?? (method === 'mobile' ? t('checkout.waiting') : t('checkout.processing'))}
        </Text>
        <Text variant="small" center>
          {method === 'mobile' ? t('checkout.pinPrompt', { phone }) : t('checkout.demoNote')}
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
            {money(amount)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="caption" color={colors.gold300} style={{ fontSize: 10 }}>
            {t('common.reference')}
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
                {t(`checkout.methods.${item.id}`)}
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
          <TextField label={t('checkout.mobileNumber')} icon="call-outline" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="07XX XXX XXX" />
        </Animated.View>
      ) : null}

      {method === 'card' ? (
        <Animated.View entering={FadeIn} style={{ gap: space.md }}>
          <TextField
            label={t('checkout.cardNumber')}
            icon="card-outline"
            keyboardType="number-pad"
            value={card.number}
            onChangeText={(value) => setCard((prev) => ({ ...prev, number: value.replace(/[^\d ]/g, '').slice(0, 23) }))}
            placeholder="4242 4242 4242 4242"
            autoComplete="off"
          />
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ flex: 1 }}>
              <TextField label={t('checkout.expiry')} value={card.expiry} onChangeText={(value) => setCard((prev) => ({ ...prev, expiry: value.slice(0, 5) }))} placeholder="MM/YY" autoComplete="off" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('checkout.cvc')}
                keyboardType="number-pad"
                value={card.cvc}
                onChangeText={(value) => setCard((prev) => ({ ...prev, cvc: value.replace(/\D/g, '').slice(0, 4) }))}
                placeholder="123"
                secureTextEntry
                autoComplete="off"
              />
            </View>
          </View>
          <Text variant="small">{t('checkout.cardNote')}</Text>
        </Animated.View>
      ) : null}

      {method === 'bank' ? (
        <Animated.View entering={FadeIn} style={styles.bank}>
          <Text variant="smallStrong">{t('checkout.bankTitle')}</Text>
          <Text variant="small">{t('checkout.bankText')}</Text>
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
        label={method === 'bank' ? t('checkout.transferred') : t('checkout.pay', { amount: money(amount) })}
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
