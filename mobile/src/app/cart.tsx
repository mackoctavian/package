import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { DemoBanner, EmptyState, SuccessMark } from '@/components/feedback';
import { FlowLayout } from '@/components/FlowLayout';
import { QuantityStepper, Segmented, TextField } from '@/components/form';
import { MockCheckout } from '@/components/MockCheckout';
import { Button, Card, Divider, Icon, Img, Text } from '@/components/ui';
import { useCatalogue } from '@/lib/api';
import { useFormat, useT } from '@/i18n';
import { EMAIL_PATTERN, makeReference, PHONE_PATTERN } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { actions, cartTotal, getAppState, useAppStore } from '@/lib/store';
import { colors, radius, space } from '@/theme';

/**
 * Bookshop cart and checkout. Orders are demo-only, like the website: there is
 * no orders table yet, so the order is kept on this phone as a receipt.
 */
export default function CartScreen() {
  const cart = useAppStore((s) => s.cart);
  const t = useT();
  const { money } = useFormat();
  const { data } = useCatalogue();
  const deliveryFee = data?.data.deliveryFee ?? 6000;
  const maxQuantity = data?.data.maxQuantity ?? 8;
  const profile = getAppState().profile;
  const [stage, setStage] = useState<'cart' | 'details' | 'pay' | 'done'>('cart');
  const [fulfilment, setFulfilment] = useState<'pickup' | 'delivery'>('pickup');
  const [details, setDetails] = useState({ fullName: profile.fullName, email: profile.email, phone: profile.phone, address: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reference] = useState(() => makeReference('ORD'));
  const [placed, setPlaced] = useState<{ total: number; count: number } | null>(null);

  const subtotal = cartTotal(cart);
  const delivery = fulfilment === 'delivery' ? deliveryFee : 0;
  const total = subtotal + delivery;

  const toDetails = () => setStage('details');
  const toPay = () => {
    const next: Record<string, string> = {};
    if (!details.fullName.trim()) next.fullName = t('common.errors.name');
    if (!EMAIL_PATTERN.test(details.email.trim())) next.email = t('common.errors.email');
    if (!PHONE_PATTERN.test(details.phone.trim())) next.phone = t('common.errors.phone');
    if (fulfilment === 'delivery' && !details.address.trim()) next.address = t('common.errors.address');
    setErrors(next);
    if (Object.keys(next).length) {
      haptic.error();
      return;
    }
    actions.saveProfile(details);
    setStage('pay');
  };

  if (stage === 'done' && placed) {
    return (
      <FlowLayout title={t('cart.placed')} onClose={() => router.back()} footer={<Button label={t('cart.continueBrowsing')} onPress={() => router.back()} />}>
        <Animated.View entering={FadeIn} style={{ alignItems: 'center', gap: space.sm }}>
          <SuccessMark />
          <Text variant="display" center>
            {t('cart.thanks')}
          </Text>
          <Text variant="body" color={colors.muted} center>
            {t('cart.placedText', { reference, count: placed.count, amount: money(placed.total) })}{' '}
            {fulfilment === 'delivery' ? t('cart.deliveryNext') : t('cart.pickupNext')}
          </Text>
        </Animated.View>
        <DemoBanner text={t('cart.demo')} />
      </FlowLayout>
    );
  }

  if (stage === 'pay') {
    return (
      <FlowLayout title={t('cart.payment')} subtitle={t('common.stepOf', { current: 3, total: 3 })} step={2} steps={3} onClose={() => router.back()} onBack={() => setStage('details')}>
        <MockCheckout
          amount={total}
          reference={reference}
          description={t('cart.description', { count: cart.reduce((n, i) => n + i.quantity, 0) })}
          defaultPhone={details.phone}
          onPaid={() => {
            const count = cart.reduce((n, i) => n + i.quantity, 0);
            actions.addReceipt({ reference, kind: 'order', title: t('cart.description', { count }), amount: total, createdAt: new Date().toISOString(), detail: fulfilment === 'delivery' ? t('cart.delivery') : t('cart.pickup') });
            actions.clearCart();
            setPlaced({ total, count });
            haptic.success();
            setStage('done');
          }}
        />
      </FlowLayout>
    );
  }

  if (!cart.length) {
    return (
      <FlowLayout title={t('cart.title')} onClose={() => router.back()}>
        <EmptyState icon="bag-outline" title={t('cart.emptyTitle')} body={t('cart.emptyText')} action={t('cart.browse')} onAction={() => { router.back(); router.push('/shop'); }} />
      </FlowLayout>
    );
  }

  const summary = (
    <Card style={{ gap: space.sm }}>
      {[
        [t('cart.subtotal'), money(subtotal)],
        [t('cart.deliveryLine'), delivery ? money(delivery) : t('cart.freePickup')],
      ].map(([label, value]) => (
        <View key={label} style={styles.line}>
          <Text variant="small">{label}</Text>
          <Text variant="smallStrong">{value}</Text>
        </View>
      ))}
      <Divider style={{ marginVertical: 4 }} />
      <View style={styles.line}>
        <Text variant="subtitle">{t('cart.total')}</Text>
        <Text variant="heading">{money(total)}</Text>
      </View>
    </Card>
  );

  if (stage === 'details') {
    return (
      <FlowLayout
        title={t('cart.detailsTitle')}
        subtitle={t('common.stepOf', { current: 2, total: 3 })}
        step={1}
        steps={3}
        onClose={() => router.back()}
        onBack={() => setStage('cart')}
        footer={<Button label={t('cart.continue', { amount: money(total) })} iconRight="arrow-forward" onPress={toPay} />}>
        <Segmented options={['pickup', 'delivery'] as const} value={fulfilment} onChange={setFulfilment} labelFor={(option) => t(`cart.${option}`)} />
        <TextField label={t('common.fields.fullName')} required value={details.fullName} onChangeText={(v) => setDetails((d) => ({ ...d, fullName: v }))} error={errors.fullName} />
        <TextField label={t('common.fields.email')} required icon="mail-outline" keyboardType="email-address" autoCapitalize="none" value={details.email} onChangeText={(v) => setDetails((d) => ({ ...d, email: v }))} error={errors.email} />
        <TextField label={t('common.fields.phone')} required icon="call-outline" keyboardType="phone-pad" value={details.phone} onChangeText={(v) => setDetails((d) => ({ ...d, phone: v }))} error={errors.phone} />
        {fulfilment === 'delivery' ? (
          <Animated.View entering={FadeInDown}>
            <TextField label={t('cart.address')} required multiline value={details.address} onChangeText={(v) => setDetails((d) => ({ ...d, address: v }))} error={errors.address} placeholder={t('cart.addressPlaceholder')} />
          </Animated.View>
        ) : null}
        {summary}
      </FlowLayout>
    );
  }

  return (
    <FlowLayout
      title={t('cart.title')}
      subtitle={t('common.stepOf', { current: 1, total: 3 })}
      step={0}
      steps={3}
      onClose={() => router.back()}
      footer={<Button label={t('cart.checkout', { amount: money(subtotal) })} variant="gold" iconRight="arrow-forward" onPress={toDetails} />}>
      {cart.map((item) => (
        <Animated.View key={item.id} entering={FadeInDown.springify()} exiting={FadeOut} layout={LinearTransition}>
          <Card style={styles.item}>
            <Pressable onPress={() => router.push({ pathname: '/publication/[slug]', params: { slug: item.slug } })}>
              <Img uri={item.coverImage} style={styles.cover} />
            </Pressable>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="bodyStrong" numberOfLines={2}>
                {item.title}
              </Text>
              <Text variant="smallStrong" color={colors.gold700}>
                {money(item.price * item.quantity)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <QuantityStepper value={item.quantity} onChange={(value) => actions.setQuantity(item.id, value)} min={1} max={maxQuantity} compact />
                <Pressable onPress={() => actions.setQuantity(item.id, 0)} hitSlop={10} accessibilityLabel={t('cart.remove', { title: item.title })}>
                  <Icon name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </Card>
        </Animated.View>
      ))}
      {summary}
    </FlowLayout>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: space.md, padding: space.md },
  cover: { width: 72, height: 96, borderRadius: radius.sm },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
