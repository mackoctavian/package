import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { ErrorBanner, SuccessMark } from '@/components/feedback';
import { FlowLayout } from '@/components/FlowLayout';
import { TextField } from '@/components/form';
import { MockCheckout } from '@/components/MockCheckout';
import { Button, Card, Icon, Text } from '@/components/ui';
import { givingFunds, givingPresets } from '@/data/content';
import { recordDonation } from '@/lib/api';
import { useFormat, useT } from '@/i18n';
import { EMAIL_PATTERN, makeReference, PHONE_PATTERN } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { actions, getAppState } from '@/lib/store';
import { colors, fonts, radius, space } from '@/theme';

type Step = 'gift' | 'details' | 'payment' | 'done';
const order: Step[] = ['gift', 'details', 'payment'];

export default function DonateScreen() {
  const params = useLocalSearchParams<{ fund?: string }>();
  const t = useT();
  const { money } = useFormat();
  const profile = getAppState().profile;
  const [step, setStep] = useState<Step>('gift');
  const [fund, setFund] = useState<string>(givingFunds.some((f) => f.id === params.fund) ? (params.fund as string) : 'general');
  const [preset, setPreset] = useState<number | null>(50000);
  const [custom, setCustom] = useState('');
  const [details, setDetails] = useState({ fullName: profile.fullName, email: profile.email, phone: profile.phone, prayerIntention: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reference] = useState(() => makeReference('GIFT'));

  const amount = useMemo(() => (custom ? Number(custom) : preset) || 0, [custom, preset]);
  const fundLabel = givingFunds.some((f) => f.id === fund) ? t(`content.funds.${fund as (typeof givingFunds)[number]['id']}.label`) : '';
  const index = order.indexOf(step);

  const continueFromGift = () => {
    if (amount < 1000) {
      setErrors({ amount: t('donate.minAmount', { amount: money(1000) }) });
      haptic.error();
      return;
    }
    setErrors({});
    setStep('details');
  };

  const continueFromDetails = () => {
    const next: Record<string, string> = {};
    if (!details.fullName.trim()) next.fullName = t('common.errors.name');
    if (!EMAIL_PATTERN.test(details.email.trim())) next.email = t('common.errors.email');
    if (!PHONE_PATTERN.test(details.phone.trim())) next.phone = t('common.errors.phone');
    setErrors(next);
    if (Object.keys(next).length) {
      haptic.error();
      return;
    }
    actions.saveProfile(details);
    setStep('payment');
  };

  const onPaid = async (method: 'mobile' | 'card' | 'bank') => {
    setSaveError(null);
    try {
      await recordDonation({ ...details, amount, paymentMethod: method, fund, reference });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t('donate.recordError'));
      throw error;
    }
    actions.addReceipt({ reference, kind: 'donation', title: t('donate.gift', { fund: fundLabel }), amount, createdAt: new Date().toISOString(), detail: t('donate.demoPayment') });
    haptic.success();
    setStep('done');
  };

  if (step === 'done') {
    return (
      <FlowLayout title={t('donate.thankYou')} onClose={() => router.back()} footer={<Button label={t('common.done')} onPress={() => router.back()} />}>
        <Animated.View entering={FadeIn} style={{ alignItems: 'center', gap: space.sm }}>
          <SuccessMark />
          <Text variant="display" center>
            {t('donate.thanksTitle')}
          </Text>
          <Text variant="body" color={colors.muted} center>
            {t('donate.thanksText', { amount: money(amount), fund: fundLabel })}
          </Text>
          <Card style={{ alignSelf: 'stretch', marginTop: space.lg, gap: space.sm }}>
            {[
              [t('common.reference'), reference],
              [t('donate.fund'), fundLabel],
              [t('donate.amountLabel'), money(amount)],
              [t('donate.payment'), t('donate.demo')],
            ].map(([label, value]) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="small">{label}</Text>
                <Text variant="smallStrong">{value}</Text>
              </View>
            ))}
          </Card>
        </Animated.View>
      </FlowLayout>
    );
  }

  return (
    <FlowLayout
      title={t(`donate.steps.${step}`)}
      subtitle={t('common.stepOf', { current: index + 1, total: 3 })}
      step={index}
      steps={3}
      onClose={() => router.back()}
      onBack={index > 0 ? () => setStep(order[index - 1]) : undefined}
      footer={
        step === 'payment' ? undefined : (
          <View style={{ gap: 8 }}>
            <Text variant="small" center>
              {t('donate.giving', { amount: money(amount), fund: fundLabel })}
            </Text>
            <Button label={t('common.continue')} iconRight="arrow-forward" onPress={step === 'gift' ? continueFromGift : continueFromDetails} />
          </View>
        )
      }>
      <Animated.View key={step} entering={FadeInRight.springify().damping(18)} exiting={FadeOutLeft.duration(120)} style={{ gap: space.lg }}>
        {step === 'gift' ? (
          <>
            <Text variant="caption">{t('donate.chooseFund')}</Text>
            <View style={{ gap: space.sm }}>
              {givingFunds.map((item) => {
                const active = fund === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      haptic.select();
                      setFund(item.id);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    style={[styles.fund, active && styles.fundActive]}>
                    <View style={[styles.fundIcon, active && { backgroundColor: colors.navy900 }]}>
                      <Icon name={item.icon} size={20} color={active ? colors.gold300 : colors.gold600} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{t(`content.funds.${item.id}.label`)}</Text>
                      <Text variant="small">{t(`content.funds.${item.id}.text`)}</Text>
                    </View>
                    <Icon name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.navy900 : colors.subtle} />
                  </Pressable>
                );
              })}
            </View>

            <Text variant="caption" style={{ marginTop: space.md }}>
              {t('donate.amount')}
            </Text>
            <View style={styles.presets}>
              {givingPresets.map((value) => {
                const active = !custom && preset === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => {
                      haptic.select();
                      setPreset(value);
                      setCustom('');
                      setErrors({});
                    }}
                    style={[styles.preset, active && styles.presetActive]}>
                    <Text variant="bodyStrong" color={active ? colors.white : colors.ink}>
                      {value.toLocaleString('en-US')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.custom, custom ? { borderColor: colors.gold400, backgroundColor: colors.gold50 } : null]}>
              <Text variant="smallStrong" color={colors.muted}>
                TZS
              </Text>
              <TextInput
                value={custom ? Number(custom).toLocaleString('en-US') : ''}
                onChangeText={(value) => {
                  setCustom(value.replace(/\D/g, '').slice(0, 9));
                  setErrors({});
                }}
                keyboardType="number-pad"
                placeholder={t('donate.otherAmount')}
                placeholderTextColor={colors.subtle}
                style={styles.customInput}
                accessibilityLabel={t('donate.otherAmount')}
              />
            </View>
            {errors.amount ? <ErrorBanner message={errors.amount} /> : null}
          </>
        ) : null}

        {step === 'details' ? (
          <>
            <TextField label={t('common.fields.fullName')} required value={details.fullName} onChangeText={(v) => setDetails((d) => ({ ...d, fullName: v }))} error={errors.fullName} autoComplete="name" />
            <TextField label={t('common.fields.email')} required icon="mail-outline" keyboardType="email-address" autoCapitalize="none" value={details.email} onChangeText={(v) => setDetails((d) => ({ ...d, email: v }))} error={errors.email} hint={t('donate.receiptHint')} />
            <TextField label={t('common.fields.phone')} required icon="call-outline" keyboardType="phone-pad" value={details.phone} onChangeText={(v) => setDetails((d) => ({ ...d, phone: v }))} error={errors.phone} />
            <TextField
              label={t('donate.intention')}
              multiline
              value={details.prayerIntention}
              onChangeText={(v) => setDetails((d) => ({ ...d, prayerIntention: v }))}
              placeholder={t('donate.intentionPlaceholder')}
              maxLength={2000}
            />
          </>
        ) : null}

        {step === 'payment' ? (
          <>
            <MockCheckout amount={amount} reference={reference} description={t('donate.gift', { fund: fundLabel })} defaultPhone={details.phone} onPaid={onPaid} busyLabel={t('donate.recording')} />
            <ErrorBanner message={saveError} />
          </>
        ) : null}
      </Animated.View>
    </FlowLayout>
  );
}

const styles = StyleSheet.create({
  fund: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  fundActive: { borderColor: colors.navy900, backgroundColor: colors.navy50 },
  fundIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.gold50, alignItems: 'center', justifyContent: 'center' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  preset: { width: '31.5%', height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  presetActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  custom: { flexDirection: 'row', alignItems: 'center', gap: space.md, height: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: space.lg },
  customInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 18, color: colors.ink },
});
