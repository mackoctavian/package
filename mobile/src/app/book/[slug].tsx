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
import { EMAIL_PATTERN, formatTZS, PHONE_PATTERN, retreatContribution } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { actions, getAppState } from '@/lib/store';
import type { Booking } from '@/lib/types';
import { colors, radius, space } from '@/theme';

const steps = [
  { id: 'about', title: 'About you' },
  { id: 'contact', title: 'Contact & parish' },
  { id: 'family', title: 'Family members' },
  { id: 'review', title: 'Review & confirm' },
] as const;

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

const validate = (step: StepId, form: BookingForm, dobText: string): Errors => {
  const errors: Errors = {};
  const required = (field: keyof BookingForm, message: string) => {
    if (!String(form[field] ?? '').trim()) errors[field] = message;
  };
  if (step === 'about') {
    required('fullName', 'Please enter your full name.');
    required('occupation', 'Please tell us your occupation.');
    if (!dobText) errors.dob = 'Please enter your date of birth.';
    else if (!form.dob || !form.age) errors.dob = 'Use the format DD/MM/YYYY.';
  }
  if (step === 'contact') {
    required('phone', 'Please enter a phone number.');
    required('email', 'Please enter your email address.');
    required('houseName', 'Please enter your house or street.');
    required('place', 'Please enter your town or village.');
    if (form.phone && !PHONE_PATTERN.test(form.phone)) errors.phone = 'Please enter a valid phone number.';
    if (!form.whatsappSame) {
      required('whatsapp', 'Please enter your WhatsApp number.');
      if (form.whatsapp && !PHONE_PATTERN.test(form.whatsapp)) errors.whatsapp = 'Please enter a valid WhatsApp number.';
    }
    if (form.altPhone && !PHONE_PATTERN.test(form.altPhone)) errors.altPhone = 'Please enter a valid phone number.';
    if (form.email && !EMAIL_PATTERN.test(form.email)) errors.email = 'Please enter a valid email address.';
    if (!form.nonCatholic) {
      required('diocese', 'Please enter your diocese.');
      required('parish', 'Please enter your parish.');
    }
  }
  if (step === 'family' && !form.acceptInstructions) errors.acceptInstructions = 'Please confirm you have read the instructions.';
  if (step === 'review' && !form.acceptTerms) errors.acceptTerms = 'Please accept the retreat terms to complete your booking.';
  return errors;
};

export default function BookRetreat() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
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
      <FlowLayout title="Book a retreat" onClose={() => router.back()}>
        <EmptyState icon="leaf-outline" title="Retreat not found" />
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
    const found = validate(step.id, form, dobText);
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
        dateRange: retreat.dateRange,
        fullName: form.fullName,
        savedAt: new Date().toISOString(),
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'We could not complete your booking.');
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
        <FlowLayout title="Retreat contribution" subtitle={retreat.title} onClose={() => router.back()} onBack={() => setStage('done')}>
          <MockCheckout
            amount={amount}
            reference={booking.ticketCode}
            description={`${retreat.title} · ${1 + guests} ${guests ? 'people' : 'person'}`}
            defaultPhone={form.phone}
            onPaid={() => {
              actions.addReceipt({
                reference: booking.ticketCode,
                kind: 'order',
                title: `Retreat contribution · ${retreat.title}`,
                amount,
                createdAt: new Date().toISOString(),
                detail: 'Demo payment',
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
        title="Booking received"
        onClose={() => router.back()}
        footer={
          <View style={{ gap: space.sm }}>
            {paymentDue && stage === 'done' ? (
              <Button label={`Pay contribution · ${formatTZS(amount)}`} variant="gold" icon="card-outline" onPress={() => setStage('pay')} />
            ) : null}
            <Button
              label="View in My tickets"
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
            {stage === 'paid' ? 'Thank you!' : 'You are booked in'}
          </Text>
          <Text variant="body" color={colors.muted} center style={{ marginTop: space.sm }}>
            {stage === 'paid'
              ? 'Your demo payment was simulated. The DMRC office will confirm your contribution.'
              : `We have sent a confirmation to ${form.email}. The office will review and approve your place.`}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <TicketCard
            code={booking.ticketCode}
            retreatTitle={retreat.title}
            dateRange={retreat.dateRange}
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
      title={step.title}
      subtitle={`Step ${stepIndex + 1} of ${steps.length} · ${retreat.title}`}
      step={stepIndex}
      steps={steps.length}
      scrollRef={scrollRef}
      onClose={() => router.back()}
      onBack={stepIndex > 0 ? () => goTo(stepIndex - 1) : undefined}
      footer={
        <Button
          label={stepIndex === steps.length - 1 ? 'Confirm booking' : 'Continue'}
          iconRight={stepIndex === steps.length - 1 ? 'checkmark' : 'arrow-forward'}
          variant={stepIndex === steps.length - 1 ? 'gold' : 'primary'}
          loading={submitting}
          onPress={next}
        />
      }>
      <Animated.View key={step.id} entering={FadeInRight.springify().damping(18)} exiting={FadeOutLeft.duration(120)} style={{ gap: space.lg }}>
        {step.id === 'about' ? (
          <>
            <TextField label="Full name" required value={form.fullName} onChangeText={(v) => update('fullName', v)} error={errors.fullName} autoComplete="name" placeholder="As on your ID" />
            <Field label="Gender" required>
              <Segmented options={['Male', 'Female'] as const} value={form.gender as 'Male' | 'Female'} onChange={(v) => update('gender', v)} />
            </Field>
            {(form.gender === 'Female' ? retreat.availability.female : retreat.availability.male) > 0 ? (
              <Text variant="small" color={colors.success}>
                {form.gender === 'Female' ? retreat.availability.female : retreat.availability.male} places for {form.gender === 'Female' ? 'women' : 'men'} on this retreat.
              </Text>
            ) : null}
            <TextField
              label="Date of birth"
              required
              value={dobText}
              keyboardType="number-pad"
              placeholder="DD/MM/YYYY"
              error={errors.dob}
              hint={form.age ? `Age ${form.age}` : undefined}
              onChangeText={(text) => {
                const masked = maskDate(text);
                setDobText(masked);
                const iso = toIsoDate(masked);
                setForm((prev) => ({ ...prev, dob: iso, age: iso ? ageFrom(iso) : '' }));
                setErrors((prev) => ({ ...prev, dob: undefined }));
              }}
            />
            <Field label="Life status">
              <Segmented options={['Single', 'Married', 'Religious', 'Widowed'] as const} value={form.lifeStatus as 'Single'} onChange={(v) => update('lifeStatus', v)} />
            </Field>
            <Field label="Currently">
              <Segmented options={['Working', 'Studying', 'N/A'] as const} value={form.currentStatus as 'Working'} onChange={(v) => update('currentStatus', v)} />
            </Field>
            <TextField label="Occupation" required value={form.occupation} onChangeText={(v) => update('occupation', v)} error={errors.occupation} placeholder="e.g. Teacher" />
          </>
        ) : null}

        {step.id === 'contact' ? (
          <>
            <TextField label="Phone" required icon="call-outline" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => update('phone', v)} error={errors.phone} autoComplete="tel" placeholder="07XX XXX XXX" />
            <Checkbox checked={form.whatsappSame} onChange={(v) => update('whatsappSame', v)} label="My WhatsApp number is the same" />
            {!form.whatsappSame ? (
              <TextField label="WhatsApp" required icon="logo-whatsapp" keyboardType="phone-pad" value={form.whatsapp} onChangeText={(v) => update('whatsapp', v)} error={errors.whatsapp} />
            ) : null}
            <TextField label="Alternative phone" icon="call-outline" keyboardType="phone-pad" value={form.altPhone} onChangeText={(v) => update('altPhone', v)} error={errors.altPhone} />
            <TextField label="Email" required icon="mail-outline" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={form.email} onChangeText={(v) => update('email', v)} error={errors.email} placeholder="you@example.com" />
            <Divider />
            <TextField label="House / street" required value={form.houseName} onChangeText={(v) => update('houseName', v)} error={errors.houseName} />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextField label="Town / village" required value={form.place} onChangeText={(v) => update('place', v)} error={errors.place} />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="District" value={form.district} onChangeText={(v) => update('district', v)} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextField label="Region" value={form.state} onChangeText={(v) => update('state', v)} />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="Country" value={form.country} onChangeText={(v) => update('country', v)} />
              </View>
            </View>
            <Divider />
            <Checkbox checked={form.nonCatholic} onChange={(v) => update('nonCatholic', v)} label="I am not Catholic" />
            {!form.nonCatholic ? (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <TextField label="Diocese" required value={form.diocese} onChangeText={(v) => update('diocese', v)} error={errors.diocese} />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField label="Parish" required value={form.parish} onChangeText={(v) => update('parish', v)} error={errors.parish} />
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {step.id === 'family' ? (
          <>
            <Text variant="body" color={colors.muted}>
              Bringing family members? Add them here so the team can prepare rooms. Leave empty if you are coming alone.
            </Text>
            {form.familyMembers.map((member, index) => (
              <Animated.View key={index} entering={FadeInDown.springify()} layout={LinearTransition}>
                <Card style={{ gap: space.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="subtitle">Guest {index + 1}</Text>
                    <Pressable
                      hitSlop={10}
                      accessibilityLabel={`Remove guest ${index + 1}`}
                      onPress={() => update('familyMembers', form.familyMembers.filter((_, i) => i !== index))}>
                      <Icon name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                  <TextField
                    label="Name"
                    value={member.name}
                    onChangeText={(v) => update('familyMembers', form.familyMembers.map((m, i) => (i === index ? { ...m, name: v } : m)))}
                  />
                  <View style={styles.row}>
                    <View style={{ flex: 2 }}>
                      <TextField
                        label="Relationship"
                        value={member.relationship}
                        placeholder="e.g. Spouse"
                        onChangeText={(v) => update('familyMembers', form.familyMembers.map((m, i) => (i === index ? { ...m, relationship: v } : m)))}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextField
                        label="Age"
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
                label="Add a family member"
                icon="person-add-outline"
                variant="secondary"
                onPress={() => update('familyMembers', [...form.familyMembers, { name: '', relationship: '', age: '' }])}
              />
            ) : null}
            <Card style={{ gap: space.sm, backgroundColor: colors.gold50, borderColor: colors.gold100 }}>
              <Text variant="subtitle">Before you come</Text>
              {['Arrive on time for registration on the first day.', 'Bring your Bible, a notebook and personal medication.', 'Silence is kept during the retreat; phones are handed in.', 'Dress modestly for chapel and sessions.'].map((line) => (
                <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
                  <Icon name="checkmark-circle" size={16} color={colors.gold600} style={{ marginTop: 3 }} />
                  <Text variant="small" color={colors.text} style={{ flex: 1 }}>
                    {line}
                  </Text>
                </View>
              ))}
            </Card>
            <Checkbox
              checked={form.acceptInstructions}
              onChange={(v) => update('acceptInstructions', v)}
              label="I have read the instructions for retreatants"
              error={errors.acceptInstructions}
            />
          </>
        ) : null}

        {step.id === 'review' ? (
          <>
            <Card style={{ gap: space.md }}>
              <Text variant="caption">Retreat</Text>
              <Text variant="heading">{retreat.title}</Text>
              <Text variant="small">
                {retreat.dateRange} · {retreat.location}
              </Text>
            </Card>
            {[
              { title: 'About you', index: 0, rows: [['Name', form.fullName], ['Gender', form.gender], ['Age', form.age], ['Life status', form.lifeStatus], ['Occupation', form.occupation]] },
              { title: 'Contact', index: 1, rows: [['Phone', form.phone], ['Email', form.email], ['Address', [form.houseName, form.place, form.country].filter(Boolean).join(', ')], ['Parish', form.nonCatholic ? 'Not Catholic' : `${form.parish}, ${form.diocese}`]] },
              { title: 'Family', index: 2, rows: [['Guests', guests ? form.familyMembers.filter((m) => m.name.trim()).map((m) => m.name).join(', ') : 'Coming alone']] },
            ].map((section) => (
              <Card key={section.title} style={{ gap: space.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="subtitle">{section.title}</Text>
                  <Pressable onPress={() => goTo(section.index)} hitSlop={10} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                    <Icon name="create-outline" size={15} color={colors.gold600} />
                    <Text variant="smallStrong" color={colors.gold600}>
                      Edit
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
                  Contribution
                </Text>
                <Text variant="title" color={colors.white}>
                  {retreat.isPaid === false || !retreat.price ? retreatContribution(retreat) : formatTZS(amount)}
                </Text>
              </View>
              <Text variant="small" color={colors.navy200} style={{ maxWidth: 150, textAlign: 'right' }}>
                {retreat.isPaid === false || !retreat.price ? 'Give as you are able' : `${1 + guests} × ${formatTZS(retreat.price)}`}
              </Text>
            </View>
            {retreat.isPaid !== false && retreat.price ? <DemoBanner text="You can pay your contribution after booking. Payments are demo-only until DMRC connects a payment provider." /> : null}
            <View style={styles.terms}>
              {retreatTerms.slice(0, 3).map((term) => (
                <Text key={term.title} variant="small">
                  <Text variant="smallStrong">{term.title}. </Text>
                  {term.body}
                </Text>
              ))}
            </View>
            <Checkbox checked={form.acceptTerms} onChange={(v) => update('acceptTerms', v)} label="I accept the retreat terms and conditions" error={errors.acceptTerms} />
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
