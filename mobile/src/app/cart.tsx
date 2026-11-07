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
import { EMAIL_PATTERN, formatTZS, makeReference, PHONE_PATTERN } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { actions, cartTotal, getAppState, useAppStore } from '@/lib/store';
import { colors, radius, space } from '@/theme';

/**
 * Bookshop cart and checkout. Orders are demo-only, like the website: there is
 * no orders table yet, so the order is kept on this phone as a receipt.
 */
export default function CartScreen() {
  const cart = useAppStore((s) => s.cart);
  const { data } = useCatalogue();
  const deliveryFee = data?.data.deliveryFee ?? 6000;
  const maxQuantity = data?.data.maxQuantity ?? 8;
  const profile = getAppState().profile;
  const [stage, setStage] = useState<'cart' | 'details' | 'pay' | 'done'>('cart');
  const [fulfilment, setFulfilment] = useState<'Pick up at DMRC' | 'Delivery'>('Pick up at DMRC');
  const [details, setDetails] = useState({ fullName: profile.fullName, email: profile.email, phone: profile.phone, address: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reference] = useState(() => makeReference('ORD'));
  const [placed, setPlaced] = useState<{ total: number; count: number } | null>(null);

  const subtotal = cartTotal(cart);
  const delivery = fulfilment === 'Delivery' ? deliveryFee : 0;
  const total = subtotal + delivery;

  const toDetails = () => setStage('details');
  const toPay = () => {
    const next: Record<string, string> = {};
    if (!details.fullName.trim()) next.fullName = 'Please enter your name.';
    if (!EMAIL_PATTERN.test(details.email.trim())) next.email = 'Please enter a valid email address.';
    if (!PHONE_PATTERN.test(details.phone.trim())) next.phone = 'Please enter a valid phone number.';
    if (fulfilment === 'Delivery' && !details.address.trim()) next.address = 'Please enter a delivery address.';
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
      <FlowLayout title="Order placed" onClose={() => router.back()} footer={<Button label="Continue browsing" onPress={() => router.back()} />}>
        <Animated.View entering={FadeIn} style={{ alignItems: 'center', gap: space.sm }}>
          <SuccessMark />
          <Text variant="display" center>
            Thank you for your order
          </Text>
          <Text variant="body" color={colors.muted} center>
            Order {reference} for {placed.count} item{placed.count > 1 ? 's' : ''} ({formatTZS(placed.total)}).{' '}
            {fulfilment === 'Delivery' ? 'We will call you to arrange delivery.' : 'Collect it from the DMRC office.'}
          </Text>
        </Animated.View>
        <DemoBanner text="Demo order: the bookshop does not take real orders in the app yet. Please call the DMRC office to confirm." />
      </FlowLayout>
    );
  }

  if (stage === 'pay') {
    return (
      <FlowLayout title="Payment" subtitle="Step 3 of 3" step={2} steps={3} onClose={() => router.back()} onBack={() => setStage('details')}>
        <MockCheckout
          amount={total}
          reference={reference}
          description={`Bookshop order · ${cart.reduce((n, i) => n + i.quantity, 0)} items`}
          defaultPhone={details.phone}
          onPaid={() => {
            const count = cart.reduce((n, i) => n + i.quantity, 0);
            actions.addReceipt({ reference, kind: 'order', title: `Bookshop order · ${count} item${count > 1 ? 's' : ''}`, amount: total, createdAt: new Date().toISOString(), detail: fulfilment });
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
      <FlowLayout title="Your cart" onClose={() => router.back()}>
        <EmptyState icon="bag-outline" title="Your cart is empty" body="Bibles, prayer books, music and calendars from DMRC Publications." action="Browse the bookshop" onAction={() => { router.back(); router.push('/shop'); }} />
      </FlowLayout>
    );
  }

  const summary = (
    <Card style={{ gap: space.sm }}>
      {[
        ['Subtotal', formatTZS(subtotal)],
        ['Delivery', delivery ? formatTZS(delivery) : 'Free pick-up'],
      ].map(([label, value]) => (
        <View key={label} style={styles.line}>
          <Text variant="small">{label}</Text>
          <Text variant="smallStrong">{value}</Text>
        </View>
      ))}
      <Divider style={{ marginVertical: 4 }} />
      <View style={styles.line}>
        <Text variant="subtitle">Total</Text>
        <Text variant="heading">{formatTZS(total)}</Text>
      </View>
    </Card>
  );

  if (stage === 'details') {
    return (
      <FlowLayout
        title="Delivery & details"
        subtitle="Step 2 of 3"
        step={1}
        steps={3}
        onClose={() => router.back()}
        onBack={() => setStage('cart')}
        footer={<Button label={`Continue · ${formatTZS(total)}`} iconRight="arrow-forward" onPress={toPay} />}>
        <Segmented options={['Pick up at DMRC', 'Delivery'] as const} value={fulfilment} onChange={setFulfilment} />
        <TextField label="Full name" required value={details.fullName} onChangeText={(v) => setDetails((d) => ({ ...d, fullName: v }))} error={errors.fullName} />
        <TextField label="Email" required icon="mail-outline" keyboardType="email-address" autoCapitalize="none" value={details.email} onChangeText={(v) => setDetails((d) => ({ ...d, email: v }))} error={errors.email} />
        <TextField label="Phone" required icon="call-outline" keyboardType="phone-pad" value={details.phone} onChangeText={(v) => setDetails((d) => ({ ...d, phone: v }))} error={errors.phone} />
        {fulfilment === 'Delivery' ? (
          <Animated.View entering={FadeInDown}>
            <TextField label="Delivery address" required multiline value={details.address} onChangeText={(v) => setDetails((d) => ({ ...d, address: v }))} error={errors.address} placeholder="Street, area, town" />
          </Animated.View>
        ) : null}
        {summary}
      </FlowLayout>
    );
  }

  return (
    <FlowLayout
      title="Your cart"
      subtitle="Step 1 of 3"
      step={0}
      steps={3}
      onClose={() => router.back()}
      footer={<Button label={`Checkout · ${formatTZS(subtotal)}`} variant="gold" iconRight="arrow-forward" onPress={toDetails} />}>
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
                {formatTZS(item.price * item.quantity)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <QuantityStepper value={item.quantity} onChange={(value) => actions.setQuantity(item.id, value)} min={1} max={maxQuantity} compact />
                <Pressable onPress={() => actions.setQuantity(item.id, 0)} hitSlop={10} accessibilityLabel={`Remove ${item.title}`}>
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
