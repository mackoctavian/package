import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, type ScrollViewInstance, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { DemoBanner, EmptyState, ErrorBanner, SuccessMark } from '@/components/feedback';
import { FlowLayout } from '@/components/FlowLayout';
import { Checkbox, Field, Segmented, TextField } from '@/components/form';
import { MockCheckout } from '@/components/MockCheckout';
import { TicketCard } from '@/components/TicketCard';
import { Button, Card, Divider, Icon, Text } from '@/components/ui';
import { retreatTerms } from '@/data/content';
import { type BookingForm, createBooking, useRetreats } from '@/lib/api';
import { type T, useFormat, useT } from '@/i18n';
import { EMAIL_PATTERN, PHONE_PATTERN, retreatContribution } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { actions, getAppState } from '@/lib/store';
import type { Booking } from '@/lib/types';
import { colors, radius, space } from '@/theme';

const steps = [{ id: 'about' }, { id: 'contact' }, { id: 'family' }, { id: 'review' }] as const;

/** Stored in English (the office reads them); shown translated via `booking.options.*`. */
const GENDERS = ['Male', 'Female'] as const;
const LIFE_STATUSES = ['Single', 'Married', 'Religious', 'Widowed'] as const;
const CURRENT_STATUSES = ['Working', 'Studying', 'N/A'] as const;
const INSTRUCTIONS = ['arrive', 'bring', 'silence', 'dress'] as const;

type StepId = (typeof steps)[number]['id'];
type Errors = Partial<Record<keyof BookingForm, string>>;

/** Accepts DD/MM/YYYY as typed and returns YYYY-MM-DD, or '' if invalid. */
const toIsoDate = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [, d, m, y] = match;
  const date = new Date(`${y}-${m}-${d}T00:00:00`);
  if (Number.isNaN(date.getTime()) || date.getDate() !== Number(d)) return '';
  return `${y}-${m}-${d}`;
};

const ageFrom = (iso: string) => {
  const birth = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 120 ? String(age) : '';
};

const maskDate = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
};

const validate = (step: StepId, form: BookingForm, dobText: string, t: T): Errors => {
  const errors: Errors = {};
  const required = (field: keyof BookingForm, message: string) => {
    if (!String(form[field] ?? '').trim()) errors[field] = message;
  };
  if (step === 'about') {
    required('fullName', t('booking.errors.fullName'));
    required('occupation', t('booking.errors.occupation'));
    if (!dobText) errors.dob = t('booking.errors.dob');
    else if (!form.dob || !form.age) errors.dob = t('booking.errors.dobFormat');
  }
  if (step === 'contact') {
    required('phone', t('booking.errors.phone'));
    required('email', t('booking.errors.email'));
    required('houseName', t('booking.errors.house'));
    required('place', t('booking.errors.town'));
    if (form.phone && !PHONE_PATTERN.test(form.phone)) errors.phone = t('booking.errors.phoneValid');
    if (!form.whatsappSame) {
      required('whatsapp', t('booking.errors.whatsapp'));
      if (form.whatsapp && !PHONE_PATTERN.test(form.whatsapp)) errors.whatsapp = t('booking.errors.whatsappValid');
    }
    if (form.altPhone && !PHONE_PATTERN.test(form.altPhone)) errors.altPhone = t('booking.errors.phoneValid');
    if (form.email && !EMAIL_PATTERN.test(form.email)) errors.email = t('booking.errors.emailValid');
    if (!form.nonCatholic) {
      required('diocese', t('booking.errors.diocese'));
      required('parish', t('booking.errors.parish'));
    }
  }
  if (step === 'family' && !form.acceptInstructions) errors.acceptInstructions = t('booking.errors.instructions');
  if (step === 'review' && !form.acceptTerms) errors.acceptTerms = t('booking.errors.terms');
  return errors;
};

export default function BookRetreat() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const t = useT();
  const { money } = useFormat();
  const option = (value: string) => t.dynamic(`booking.options.${value}`, undefined, value);
  const { data } = useRetreats();
  const retreat = data?.data.find((item) => item.slug === slug);
  const profile = getAppState().profile;

  const [form, setForm] = useState<BookingForm>({
    fullName: profile.fullName,
    gender: 'Male',
    dob: '',
    age: '',
    lifeStatus: 'Single',
    currentStatus: 'Working',
    occupation: '',
    nonCatholic: false,
    phone: profile.phone,
    whatsappSame: true,
    whatsapp: '',
    altPhone: '',
    email: profile.email,
    houseName: '',
    place: '',
    district: '',
    state: '',
    country: 'Tanzania',
    diocese: '',
    parish: '',
    familyMembers: [],
    acceptInstructions: false,
    acceptTerms: false,
  });
  const [dobText, setDobText] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booking, setBooking] = useState<{ data: Booking; ticketCode: string } | null>(null);
  const [stage, setStage] = useState<'done' | 'pay' | 'paid'>('done');
  const scrollRef = useRef<ScrollViewInstance>(null);

  if (!retreat) {
    return (
      <FlowLayout title={t('booking.title')} onClose={() => router.back()}>
        <EmptyState icon="leaf-outline" title={t('retreats.notFound')} />
      </FlowLayout>
    );
  }

  const step = steps[stepIndex];
  const update = <K extends keyof BookingForm>(field: K, value: BookingForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value, ...(field === 'nonCatholic' && value ? { diocese: '', parish: '' } : {}) }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const goTo = (index: number) => {
    setErrors({});
    setStepIndex(index);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const next = async () => {
    const found = validate(step.id, form, dobText, t);
    if (Object.keys(found).length) {
      setErrors(found);
      haptic.error();
      return;
    }
    if (stepIndex < steps.length - 1) return goTo(stepIndex + 1);

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createBooking(retreat, form);
      setBooking(result);
      haptic.success();
      actions.saveProfile({ fullName: form.fullName, email: form.email, phone: form.phone });
      actions.saveTicket({
        code: result.ticketCode,
        bookingId: result.data.id,
        retreatSlug: retreat.slug,
        retreatTitle: retreat.title,
        dateRange: retreat.dateLabel ?? retreat.dateRange,
        fullName: form.fullName,
        savedAt: new Date().toISOString(),
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('booking.errors.submit'));
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  const guests = form.familyMembers.filter((member) => member.name.trim()).length;
  const amount = (retreat.price ?? 0) * (1 + guests);

  /* ------------------------------------------------------------ Success */
  if (booking) {
    const paymentDue = booking.data.paymentStatus === 'pending' && retreat.isPaid !== false && amount > 0;
    if (stage === 'pay') {
      return (
        <FlowLayout title={t('booking.done.payTitle')} subtitle={retreat.title} onClose={() => router.back()} onBack={() => setStage('done')}>
          <MockCheckout
            amount={amount}
            reference={booking.ticketCode}
            description={t('booking.done.people', { retreat: retreat.title, count: 1 + guests })}
            defaultPhone={form.phone}
            onPaid={() => {
              actions.addReceipt({
                reference: booking.ticketCode,
                kind: 'order',
                title: t('booking.done.receipt', { retreat: retreat.title }),
                amount,
                createdAt: new Date().toISOString(),
                detail: t('donate.demoPayment'),
              });
              haptic.success();
              setStage('paid');
            }}
          />
        </FlowLayout>
      );
    }
    return (
      <FlowLayout
        title={t('booking.done.title')}
        onClose={() => router.back()}
        footer={
          <View style={{ gap: space.sm }}>
            {paymentDue && stage === 'done' ? (
              <Button label={t('booking.done.pay', { amount: money(amount) })} variant="gold" icon="card-outline" onPress={() => setStage('pay')} />
            ) : null}
            <Button
              label={t('booking.done.viewTickets')}
              variant={paymentDue && stage === 'done' ? 'secondary' : 'primary'}
              onPress={() => {
                router.back();
                router.push('/tickets');
              }}
            />
          </View>
        }>
        <Animated.View entering={FadeIn} style={{ alignItems: 'center' }}>
          <SuccessMark />
          <Text variant="display" center>
            {stage === 'paid' ? t('booking.done.thanks') : t('booking.done.booked')}
          </Text>
          <Text variant="body" color={colors.muted} center style={{ marginTop: space.sm }}>
            {stage === 'paid' ? t('booking.done.paidText') : t('booking.done.bookedText', { email: form.email })}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <TicketCard
            code={booking.ticketCode}
            retreatTitle={retreat.title}
            dateRange={retreat.dateLabel ?? retreat.dateRange}
            fullName={form.fullName}
            status={booking.data.status}
            paymentStatus={stage === 'paid' ? 'pending' : booking.data.paymentStatus}
            guests={guests}
          />
        </Animated.View>
      </FlowLayout>
    );
  }

  /* --------------------------------------------------------------- Steps */
  return (
    <FlowLayout
      title={t(`booking.steps.${step.id}`)}
      subtitle={t('booking.stepSubtitle', { current: stepIndex + 1, total: steps.length, retreat: retreat.title })}
      step={stepIndex}
      steps={steps.length}
      scrollRef={scrollRef}
      onClose={() => router.back()}
      onBack={stepIndex > 0 ? () => goTo(stepIndex - 1) : undefined}
      footer={
        <Button
          label={stepIndex === steps.length - 1 ? t('booking.confirm') : t('common.continue')}
          iconRight={stepIndex === steps.length - 1 ? 'checkmark' : 'arrow-forward'}
          variant={stepIndex === steps.length - 1 ? 'gold' : 'primary'}
          loading={submitting}
          onPress={next}
        />
      }>
      <Animated.View key={step.id} entering={FadeInRight.springify().damping(18)} exiting={FadeOutLeft.duration(120)} style={{ gap: space.lg }}>
        {step.id === 'about' ? (
          <>
            <TextField label={t('booking.fields.fullName')} required value={form.fullName} onChangeText={(v) => update('fullName', v)} error={errors.fullName} autoComplete="name" placeholder={t('booking.fields.fullNamePlaceholder')} />
            <Field label={t('booking.fields.gender')} required>
              <Segmented options={GENDERS} value={form.gender as (typeof GENDERS)[number]} onChange={(v) => update('gender', v)} labelFor={option} />
            </Field>
            {(form.gender === 'Female' ? retreat.availability.female : retreat.availability.male) > 0 ? (
              <Text variant="small" color={colors.success}>
                {form.gender === 'Female'
                  ? t('booking.placesForWomen', { count: retreat.availability.female })
                  : t('booking.placesForMen', { count: retreat.availability.male })}
              </Text>
            ) : null}
            <TextField
              label={t('booking.fields.dob')}
              required
              value={dobText}
              keyboardType="number-pad"
              placeholder="DD/MM/YYYY"
              error={errors.dob}
              hint={form.age ? t('booking.fields.age', { age: form.age }) : undefined}
              onChangeText={(text) => {
                const masked = maskDate(text);
                setDobText(masked);
                const iso = toIsoDate(masked);
                setForm((prev) => ({ ...prev, dob: iso, age: iso ? ageFrom(iso) : '' }));
                setErrors((prev) => ({ ...prev, dob: undefined }));
              }}
            />
            <Field label={t('booking.fields.lifeStatus')}>
              <Segmented options={LIFE_STATUSES} value={form.lifeStatus as (typeof LIFE_STATUSES)[number]} onChange={(v) => update('lifeStatus', v)} labelFor={option} />
            </Field>
            <Field label={t('booking.fields.currently')}>
              <Segmented options={CURRENT_STATUSES} value={form.currentStatus as (typeof CURRENT_STATUSES)[number]} onChange={(v) => update('currentStatus', v)} labelFor={option} />
            </Field>
            <TextField label={t('booking.fields.occupation')} required value={form.occupation} onChangeText={(v) => update('occupation', v)} error={errors.occupation} placeholder={t('booking.fields.occupationPlaceholder')} />
          </>
        ) : null}

        {step.id === 'contact' ? (
          <>
            <TextField label={t('booking.fields.phone')} required icon="call-outline" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => update('phone', v)} error={errors.phone} autoComplete="tel" placeholder="07XX XXX XXX" />
            <Checkbox checked={form.whatsappSame} onChange={(v) => update('whatsappSame', v)} label={t('booking.fields.whatsappSame')} />
            {!form.whatsappSame ? (
              <TextField label={t('booking.fields.whatsapp')} required icon="logo-whatsapp" keyboardType="phone-pad" value={form.whatsapp} onChangeText={(v) => update('whatsapp', v)} error={errors.whatsapp} />
            ) : null}
            <TextField label={t('booking.fields.altPhone')} icon="call-outline" keyboardType="phone-pad" value={form.altPhone} onChangeText={(v) => update('altPhone', v)} error={errors.altPhone} />
            <TextField label={t('booking.fields.email')} required icon="mail-outline" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={form.email} onChangeText={(v) => update('email', v)} error={errors.email} placeholder="you@example.com" />
            <Divider />
            <TextField label={t('booking.fields.house')} required value={form.houseName} onChangeText={(v) => update('houseName', v)} error={errors.houseName} />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextField label={t('booking.fields.town')} required value={form.place} onChangeText={(v) => update('place', v)} error={errors.place} />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label={t('booking.fields.district')} value={form.district} onChangeText={(v) => update('district', v)} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextField label={t('booking.fields.region')} value={form.state} onChangeText={(v) => update('state', v)} />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label={t('booking.fields.country')} value={form.country} onChangeText={(v) => update('country', v)} />
              </View>
            </View>
            <Divider />
            <Checkbox checked={form.nonCatholic} onChange={(v) => update('nonCatholic', v)} label={t('booking.fields.nonCatholic')} />
            {!form.nonCatholic ? (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <TextField label={t('booking.fields.diocese')} required value={form.diocese} onChangeText={(v) => update('diocese', v)} error={errors.diocese} />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField label={t('booking.fields.parish')} required value={form.parish} onChangeText={(v) => update('parish', v)} error={errors.parish} />
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {step.id === 'family' ? (
          <>
            <Text variant="body" color={colors.muted}>
              {t('booking.family.intro')}
            </Text>
            {form.familyMembers.map((member, index) => (
              <Animated.View key={index} entering={FadeInDown.springify()} layout={LinearTransition}>
                <Card style={{ gap: space.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="subtitle">{t('booking.family.guest', { number: index + 1 })}</Text>
                    <Pressable
                      hitSlop={10}
                      accessibilityLabel={t('booking.family.remove', { number: index + 1 })}
                      onPress={() => update('familyMembers', form.familyMembers.filter((_, i) => i !== index))}>
                      <Icon name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                  <TextField
                    label={t('booking.family.name')}
                    value={member.name}
                    onChangeText={(v) => update('familyMembers', form.familyMembers.map((m, i) => (i === index ? { ...m, name: v } : m)))}
                  />
                  <View style={styles.row}>
                    <View style={{ flex: 2 }}>
                      <TextField
                        label={t('booking.family.relationship')}
                        value={member.relationship}
                        placeholder={t('booking.family.relationshipPlaceholder')}
                        onChangeText={(v) => update('familyMembers', form.familyMembers.map((m, i) => (i === index ? { ...m, relationship: v } : m)))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextField
                        label={t('booking.family.age')}
                        keyboardType="number-pad"
                        value={member.age}
                        onChangeText={(v) => update('familyMembers', form.familyMembers.map((m, i) => (i === index ? { ...m, age: v.replace(/\D/g, '').slice(0, 3) } : m)))}
                      />
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
            {form.familyMembers.length < 8 ? (
              <Button
                label={t('booking.family.add')}
                icon="person-add-outline"
                variant="secondary"
                onPress={() => update('familyMembers', [...form.familyMembers, { name: '', relationship: '', age: '' }])}
              />
            ) : null}
            <Card style={{ gap: space.sm, backgroundColor: colors.gold50, borderColor: colors.gold100 }}>
              <Text variant="subtitle">{t('booking.instructions.title')}</Text>
              {INSTRUCTIONS.map((id) => (
                <View key={id} style={{ flexDirection: 'row', gap: 8 }}>
                  <Icon name="checkmark-circle" size={16} color={colors.gold600} style={{ marginTop: 3 }} />
                  <Text variant="small" color={colors.text} style={{ flex: 1 }}>
                    {t(`booking.instructions.${id}`)}
                  </Text>
                </View>
              ))}
            </Card>
            <Checkbox
              checked={form.acceptInstructions}
              onChange={(v) => update('acceptInstructions', v)}
              label={t('booking.instructions.accept')}
              error={errors.acceptInstructions}
            />
          </>
        ) : null}

        {step.id === 'review' ? (
          <>
            <Card style={{ gap: space.md }}>
              <Text variant="caption">{t('booking.review.retreat')}</Text>
              <Text variant="heading">{retreat.title}</Text>
              <Text variant="small">
                {retreat.dateLabel ?? retreat.dateRange} · {retreat.location}
              </Text>
            </Card>
            {[
              {
                title: t('booking.review.about'),
                index: 0,
                rows: [
                  [t('booking.review.name'), form.fullName],
                  [t('booking.review.gender'), option(form.gender)],
                  [t('booking.review.age'), form.age],
                  [t('booking.review.lifeStatus'), option(form.lifeStatus)],
                  [t('booking.review.occupation'), form.occupation],
                ],
              },
              {
                title: t('booking.review.contact'),
                index: 1,
                rows: [
                  [t('booking.review.phone'), form.phone],
                  [t('booking.review.email'), form.email],
                  [t('booking.review.address'), [form.houseName, form.place, form.country].filter(Boolean).join(', ')],
                  [t('booking.review.parish'), form.nonCatholic ? t('booking.review.notCatholic') : `${form.parish}, ${form.diocese}`],
                ],
              },
              {
                title: t('booking.review.family'),
                index: 2,
                rows: [[t('booking.review.guests'), guests ? form.familyMembers.filter((m) => m.name.trim()).map((m) => m.name).join(', ') : t('booking.review.alone')]],
              },
            ].map((section) => (
              <Card key={section.title} style={{ gap: space.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="subtitle">{section.title}</Text>
                  <Pressable onPress={() => goTo(section.index)} hitSlop={10} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                    <Icon name="create-outline" size={15} color={colors.gold600} />
                    <Text variant="smallStrong" color={colors.gold600}>
                      {t('common.edit')}
                    </Text>
                  </Pressable>
                </View>
                {section.rows.map(([label, value]) => (
                  <View key={label} style={styles.reviewRow}>
                    <Text variant="small">{label}</Text>
                    <Text variant="smallStrong" style={{ flex: 1, textAlign: 'right' }}>
                      {value || '—'}
                    </Text>
                  </View>
                ))}
              </Card>
            ))}
            <View style={styles.total}>
              <View>
                <Text variant="small" color={colors.navy200}>
                  {t('booking.review.contribution')}
                </Text>
                <Text variant="title" color={colors.white}>
                  {retreat.isPaid === false || !retreat.price ? retreatContribution(retreat, t, money) : money(amount)}
                </Text>
              </View>
              <Text variant="small" color={colors.navy200} style={{ maxWidth: 150, textAlign: 'right' }}>
                {retreat.isPaid === false || !retreat.price ? t('booking.review.giveAsAble') : `${1 + guests} × ${money(retreat.price)}`}
              </Text>
            </View>
            {retreat.isPaid !== false && retreat.price ? <DemoBanner text={t('booking.review.payLater')} /> : null}
            <View style={styles.terms}>
              {retreatTerms.slice(0, 3).map((term) => (
                <Text key={term} variant="small">
                  <Text variant="smallStrong">{t(`content.terms.${term}.title`)}. </Text>
                  {t(`content.terms.${term}.body`)}
                </Text>
              ))}
            </View>
            <Checkbox checked={form.acceptTerms} onChange={(v) => update('acceptTerms', v)} label={t('booking.review.acceptTerms')} error={errors.acceptTerms} />
            <ErrorBanner message={submitError} />
          </>
        ) : null}
      </Animated.View>
    </FlowLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.lg },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: space.xl, borderRadius: radius.xl, backgroundColor: colors.navy900 },
  terms: { gap: space.sm, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
});
