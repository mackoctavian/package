import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ErrorBanner, SuccessMark } from '@/components/feedback';
import { FlowLayout } from '@/components/FlowLayout';
import { Checkbox, Field, QuantityStepper, TextField } from '@/components/form';
import { MockCheckout } from '@/components/MockCheckout';
import { Button, Card, Icon, Text } from '@/components/ui';
import { intentionTypes, SUGGESTED_OFFERING_PER_MASS } from '@/data/content';
import { submitMassIntention } from '@/lib/api';
import { useFormat, useT } from '@/i18n';
import { EMAIL_PATTERN, makeReference, PHONE_PATTERN } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { actions, getAppState } from '@/lib/store';
import { colors, radius, space } from '@/theme';

type IntentionType = (typeof intentionTypes)[number]['id'];

const maskDate = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
};

const parseFutureDate = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const date = new Date(`${match[3]}-${match[2]}-${match[1]}T09:00:00`);
  if (Number.isNaN(date.getTime()) || date.getDate() !== Number(match[1])) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today ? date : null;
};

export default function MassIntentionScreen() {
  const profile = getAppState().profile;
  const t = useT();
  const { money, date } = useFormat();
  const [type, setType] = useState<IntentionType>('thanksgiving');
  const [intentionFor, setIntentionFor] = useState('');
  const [details, setDetails] = useState('');
  const [dateText, setDateText] = useState('');
  const [masses, setMasses] = useState(1);
  const [offering, setOffering] = useState('');
  const [person, setPerson] = useState({ fullName: profile.fullName, email: profile.email, phone: profile.phone });
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stage, setStage] = useState<'form' | 'done' | 'pay' | 'paid'>('form');
  const [reference] = useState(() => makeReference('MASS'));

  const suggested = masses * SUGGESTED_OFFERING_PER_MASS;
  const amount = Number(offering) || suggested;
  const typeLabel = t(`content.intentions.${type}.label`);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!intentionFor.trim()) next.intentionFor = t('mass.errors.for');
    if (!details.trim()) next.details = t('mass.errors.details');
    if (dateText && !parseFutureDate(dateText)) next.date = t('mass.errors.date');
    if (!person.fullName.trim()) next.fullName = t('common.errors.name');
    if (!EMAIL_PATTERN.test(person.email.trim())) next.email = t('common.errors.email');
    if (!PHONE_PATTERN.test(person.phone.trim())) next.phone = t('common.errors.phone');
    if (!accept) next.accept = t('mass.errors.accept');
    setErrors(next);
    if (Object.keys(next).length) {
      haptic.error();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitMassIntention({
        ...person,
        intentionType: type,
        intentionFor,
        intentionDetails: details,
        preferredDate: parseFutureDate(dateText)?.toISOString(),
        numberOfMasses: masses,
        donationAmount: String(amount),
      });
      actions.saveProfile(person);
      haptic.success();
      setStage('done');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('mass.errors.submit'));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === 'pay') {
    return (
      <FlowLayout title={t('mass.offeringTitle')} onClose={() => router.back()} onBack={() => setStage('done')}>
        <MockCheckout
          amount={amount}
          reference={reference}
          description={t('mass.description', { count: masses, type: typeLabel })}
          defaultPhone={person.phone}
          onPaid={() => {
            actions.addReceipt({ reference, kind: 'mass-intention', title: t('mass.receipt', { name: intentionFor }), amount, createdAt: new Date().toISOString(), detail: t('donate.demoPayment') });
            haptic.success();
            setStage('paid');
          }}
        />
      </FlowLayout>
    );
  }

  if (stage === 'done' || stage === 'paid') {
    return (
      <FlowLayout
        title={t('mass.received')}
        onClose={() => router.back()}
        footer={
          <View style={{ gap: space.sm }}>
            {stage === 'done' ? <Button label={t('mass.giveOffering', { amount: money(amount) })} variant="gold" icon="heart-outline" onPress={() => setStage('pay')} /> : null}
            <Button label={t('common.done')} variant={stage === 'done' ? 'secondary' : 'primary'} onPress={() => router.back()} />
          </View>
        }>
        <Animated.View entering={FadeIn} style={{ alignItems: 'center', gap: space.sm }}>
          <SuccessMark />
          <Text variant="display" center>
            {stage === 'paid' ? t('mass.paidTitle') : t('mass.withUs')}
          </Text>
          <Text variant="body" color={colors.muted} center>
            {stage === 'paid' ? t('mass.paidText') : t('mass.doneText', { count: masses, name: intentionFor, email: person.email })}
          </Text>
        </Animated.View>
        <Card style={{ gap: space.sm }}>
          {[
            [t('mass.summary.intention'), typeLabel],
            [t('mass.summary.for'), intentionFor],
            [t('mass.summary.masses'), String(masses)],
            [t('mass.summary.date'), dateText ? date(parseFutureDate(dateText)?.toISOString()) : t('mass.summary.nextAvailable')],
            [t('mass.summary.offering'), money(amount)],
          ].map(([label, value]) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.lg }}>
              <Text variant="small">{label}</Text>
              <Text variant="smallStrong" style={{ flex: 1, textAlign: 'right' }}>
                {value}
              </Text>
            </View>
          ))}
        </Card>
      </FlowLayout>
    );
  }

  return (
    <FlowLayout
      title={t('mass.title')}
      subtitle={t('mass.subtitle')}
      onClose={() => router.back()}
      footer={<Button label={t('mass.send')} icon="paper-plane-outline" variant="gold" loading={submitting} onPress={submit} />}>
      <Animated.View entering={FadeInDown.springify()} style={{ gap: space.lg }}>
        <Text variant="caption">{t('mass.section1')}</Text>
        <View style={styles.types}>
          {intentionTypes.map((item) => {
            const active = type === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  haptic.select();
                  setType(item.id);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={[styles.type, active && styles.typeActive]}>
                <Icon name={item.icon} size={22} color={active ? colors.gold300 : colors.gold600} />
                <Text variant="smallStrong" color={active ? colors.white : colors.ink} style={{ marginTop: 6 }}>
                  {t(`content.intentions.${item.id}.label`)}
                </Text>
                <Text variant="small" color={active ? colors.navy200 : colors.muted} style={{ fontSize: 12 }}>
                  {t(`content.intentions.${item.id}.description`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextField label={t('mass.offeredFor')} required value={intentionFor} onChangeText={setIntentionFor} placeholder={t(`content.intentions.${type}.placeholder`)} error={errors.intentionFor} />
        <TextField
          label={t('mass.yourIntention')}
          required
          multiline
          maxLength={4000}
          value={details}
          onChangeText={setDetails}
          error={errors.details}
          hint={t('mass.intentionHint')}
          placeholder={t('mass.intentionPlaceholder')}
        />

        <Text variant="caption" style={{ marginTop: space.md }}>
          {t('mass.section2')}
        </Text>
        <TextField
          label={t('mass.preferredDate')}
          icon="calendar-outline"
          keyboardType="number-pad"
          placeholder="DD/MM/YYYY"
          value={dateText}
          onChangeText={(text) => setDateText(maskDate(text))}
          error={errors.date}
          hint={t('mass.dateHint')}
        />
        <Field label={t('mass.masses')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <QuantityStepper value={masses} onChange={setMasses} min={1} max={50} />
            <Text variant="small">{t('mass.customary', { amount: money(SUGGESTED_OFFERING_PER_MASS) })}</Text>
          </View>
        </Field>
        <TextField
          label={t('mass.offering')}
          keyboardType="number-pad"
          value={offering}
          onChangeText={(v) => setOffering(v.replace(/\D/g, '').slice(0, 9))}
          placeholder={suggested.toLocaleString('en-US')}
          hint={t('mass.offeringHint')}
        />

        <Text variant="caption" style={{ marginTop: space.md }}>
          {t('mass.section3')}
        </Text>
        <TextField label={t('common.fields.fullName')} required value={person.fullName} onChangeText={(v) => setPerson((p) => ({ ...p, fullName: v }))} error={errors.fullName} autoComplete="name" />
        <TextField label={t('common.fields.email')} required icon="mail-outline" keyboardType="email-address" autoCapitalize="none" value={person.email} onChangeText={(v) => setPerson((p) => ({ ...p, email: v }))} error={errors.email} />
        <TextField label={t('common.fields.phone')} required icon="call-outline" keyboardType="phone-pad" value={person.phone} onChangeText={(v) => setPerson((p) => ({ ...p, phone: v }))} error={errors.phone} />
        <Checkbox
          checked={accept}
          onChange={setAccept}
          error={errors.accept}
          label={t('mass.accept')}
        />
        <ErrorBanner message={submitError} />
      </Animated.View>
    </FlowLayout>
  );
}

const styles = StyleSheet.create({
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  type: { width: '48.5%', padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  typeActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
});
