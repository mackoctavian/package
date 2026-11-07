import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, SearchField, Sheet, SheetOption } from '@/components/admin';
import { Button, Icon, type IconName, Text } from '@/components/ui';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatTime } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { invalidateBookings, keys } from '@/lib/queries';
import type { CheckInDesk, ScanResult } from '@/lib/types';
import { colors, fonts, radius, space, TAB_BAR_SPACE } from '@/theme';

const RETREAT_KEY = 'dmrc-admin-scan-retreat';
const FRAME = 250;

type Outcome = { kind: 'success' | 'already' | 'warning' | 'error'; title: string; detail?: string; result?: ScanResult };

const outcomeStyle: Record<Outcome['kind'], { bg: string; icon: IconName; tint: string }> = {
  success: { bg: '#1f6b3a', icon: 'checkmark-circle', tint: '#b9f0c9' },
  already: { bg: '#8a5a12', icon: 'time', tint: '#ffe2a8' },
  warning: { bg: '#8a5a12', icon: 'alert-circle', tint: '#ffe2a8' },
  error: { bg: '#8f2f28', icon: 'close-circle', tint: '#ffc7c1' },
};

const toOutcome = (result: ScanResult): Outcome => {
  const who = result.booking ? `${result.booking.fullName}${result.booking.partySize > 1 ? ` · party of ${result.booking.partySize}` : ''}` : undefined;
  if (result.valid && !result.alreadyCheckedIn) return { kind: 'success', title: 'Welcome!', detail: who, result };
  if (result.valid && result.alreadyCheckedIn)
    return { kind: 'already', title: 'Already checked in', detail: `${who ?? ''}${result.checkedInAt ? ` · at ${formatTime(result.checkedInAt)}` : ''}`, result };
  if (result.wrongRetreat) return { kind: 'warning', title: 'Different retreat', detail: `${result.error ?? ''}${who ? `\n${who}` : ''}`, result };
  return { kind: 'error', title: result.booking ? 'Cannot check in' : 'Ticket not found', detail: result.error ?? 'This code does not match a booking.', result };
};

export default function Scan() {
  const params = useLocalSearchParams<{ retreatId?: string }>();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const client = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [appActive, setAppActive] = useState(true);
  const [retreatId, setRetreatId] = useState<string | undefined>(params.retreatId);
  const [picker, setPicker] = useState(false);
  const [guests, setGuests] = useState(false);
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const [filter, setFilter] = useState('');
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const lastScan = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => sub.remove();
  }, []);

  // A retreat passed in the link wins; otherwise restore the last one used on this phone.
  const [appliedRetreat, setAppliedRetreat] = useState(params.retreatId);
  if (params.retreatId !== appliedRetreat) {
    setAppliedRetreat(params.retreatId);
    if (params.retreatId) setRetreatId(params.retreatId);
  }

  useEffect(() => {
    if (params.retreatId) return;
    AsyncStorage.getItem(RETREAT_KEY)
      .then((saved) => {
        if (saved) setRetreatId((current) => current ?? saved);
      })
      .catch(() => undefined);
  }, [params.retreatId]);

  useEffect(() => {
    if (retreatId) AsyncStorage.setItem(RETREAT_KEY, retreatId).catch(() => undefined);
  }, [retreatId]);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  const desk = useQuery({
    queryKey: keys.checkIn(retreatId),
    queryFn: ({ signal }) => api<CheckInDesk>(`/api/admin/check-in${retreatId ? `?retreatId=${retreatId}` : ''}`, { signal }),
    refetchInterval: focused && appActive ? 6000 : false,
  });
  const retreats = desk.data?.retreats ?? [];
  const retreat = retreats.find((item) => item.id === retreatId);
  const stats = desk.data?.data;

  const submit = async (body: { ticketCode?: string; bookingId?: string; undo?: boolean }) => {
    setBusy(true);
    clearTimeout(resumeTimer.current);
    try {
      const result = await api<ScanResult>('/api/retreats/bookings/scan', { method: 'POST', body: { ...body, retreatId } });
      const next = body.undo ? ({ kind: 'warning', title: 'Check-in undone', detail: result.booking?.fullName, result } as Outcome) : toOutcome(result);
      setOutcome(next);
      if (next.kind === 'success') haptic.success();
      else haptic.error();
    } catch (error) {
      const result = error instanceof ApiError && error.body && typeof error.body === 'object' ? (error.body as ScanResult) : null;
      setOutcome(result && 'valid' in result ? toOutcome(result) : { kind: 'error', title: 'Scan failed', detail: errorMessage(error) });
      haptic.error();
    } finally {
      setBusy(false);
      invalidateBookings(client);
      resumeTimer.current = setTimeout(() => setOutcome((current) => (current?.kind === 'success' ? null : current)), 2600);
    }
  };

  const onBarcode = ({ data }: BarcodeScanningResult) => {
    if (busy || outcome || !data) return;
    const now = Date.now();
    // The camera reports the same code many times a second; ignore repeats.
    if (lastScan.current.code === data && now - lastScan.current.at < 4000) return;
    lastScan.current = { code: data, at: now };
    haptic.tap();
    submit({ ticketCode: data });
  };

  const cameraOn = focused && appActive && permission?.granted && !manual && !guests && !picker;
  const expected = (stats?.expected ?? []).filter((guest) => {
    const term = filter.trim().toLowerCase();
    return !term || guest.fullName.toLowerCase().includes(term) || guest.phone.includes(term) || (guest.ticketCode ?? '').toLowerCase().includes(term);
  });

  return (
    <View style={styles.screen}>
      {cameraOn ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={busy || outcome ? undefined : onBarcode}
        />
      ) : null}
      <View style={[StyleSheet.absoluteFill, styles.shade]} pointerEvents="none" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.retreatButton} onPress={() => setPicker(true)} accessibilityRole="button" accessibilityLabel="Choose retreat">
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={colors.gold300}>
              Check-in desk
            </Text>
            <Text variant="subtitle" color={colors.white} numberOfLines={1}>
              {retreat?.title ?? 'Choose a retreat'}
            </Text>
          </View>
          <Icon name="chevron-down" size={18} color={colors.navy200} />
        </Pressable>
        <IconButton icon={torch ? 'flashlight' : 'flashlight-outline'} label="Torch" tone="glass" onPress={() => setTorch((value) => !value)} />
      </View>

      {stats ? (
        <Animated.View entering={FadeIn} style={styles.stats}>
          <Stat label="Guests in" value={`${stats.guestsArrived}/${stats.guests}`} />
          <View style={styles.statDivider} />
          <Stat label="Tickets" value={`${stats.bookingsArrived}/${stats.bookings}`} />
          <View style={styles.statDivider} />
          <Stat label="To approve" value={String(stats.pendingApproval)} />
        </Animated.View>
      ) : null}

      {/* Viewfinder or permission prompt */}
      <View style={styles.center} pointerEvents="box-none">
        {!permission ? null : !permission.granted ? (
          <View style={styles.permission}>
            <Icon name="camera-outline" size={36} color={colors.gold300} />
            <Text variant="heading" color={colors.white} center>
              Camera access needed
            </Text>
            <Text variant="small" color={colors.navy200} center>
              Allow the camera to scan the QR code on each guest&apos;s ticket. You can also type a code or pick from the guest list.
            </Text>
            <Button
              label={permission.canAskAgain ? 'Allow camera' : 'Open settings'}
              variant="gold"
              size="md"
              onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
              style={{ marginTop: space.sm }}
            />
          </View>
        ) : (
          <Viewfinder active={Boolean(cameraOn) && !busy && !outcome} />
        )}
        {busy ? <ActivityIndicator color={colors.gold300} size="large" style={{ position: 'absolute' }} /> : null}
      </View>

      {/* Result */}
      {outcome ? (
        <Animated.View entering={SlideInDown.springify().damping(17)} exiting={SlideOutDown.duration(200)} style={[styles.result, { backgroundColor: outcomeStyle[outcome.kind].bg, bottom: TAB_BAR_SPACE + 10 }]}>
          <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Icon name={outcomeStyle[outcome.kind].icon} size={40} color={outcomeStyle[outcome.kind].tint} />
            <View style={{ flex: 1 }}>
              <Text variant="title" color={colors.white}>
                {outcome.title}
              </Text>
              {outcome.detail ? (
                <Text variant="body" color={outcomeStyle[outcome.kind].tint}>
                  {outcome.detail}
                </Text>
              ) : null}
            </View>
          </View>
          {outcome.result?.booking ? (
            <Text variant="small" color="rgba(255,255,255,0.75)">
              {outcome.result.booking.retreat.title} · {outcome.result.booking.ticketCode ?? ''} · {outcome.result.booking.paymentStatus === 'paid' ? 'Paid' : 'Payment pending'}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {outcome.kind === 'success' && outcome.result?.booking ? (
              <Button label="Undo" variant="light" size="md" icon="arrow-undo" onPress={() => submit({ bookingId: outcome.result!.booking!.id, undo: true })} style={{ flex: 1 }} />
            ) : null}
            <Button label="Scan next" variant="gold" size="md" icon="scan" onPress={() => setOutcome(null)} style={{ flex: 1 }} />
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown} exiting={FadeOut} style={[styles.actions, { bottom: TAB_BAR_SPACE + 10 }]}>
          <Pressable style={styles.action} onPress={() => setManual(true)} accessibilityRole="button">
            <Icon name="keypad-outline" size={20} color={colors.white} />
            <Text style={styles.actionLabel}>Type code</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => (retreatId ? setGuests(true) : setPicker(true))} accessibilityRole="button">
            <Icon name="people-outline" size={20} color={colors.white} />
            <Text style={styles.actionLabel}>Guest list{stats ? ` · ${stats.expected.length}` : ''}</Text>
          </Pressable>
        </Animated.View>
      )}

      <Sheet visible={picker} onClose={() => setPicker(false)} title="Which retreat?">
        {retreats.length ? null : <ActivityIndicator color={colors.gold500} style={{ margin: space.xl }} />}
        <SheetOption
          label="Any retreat"
          description="Accept every valid ticket"
          icon="albums-outline"
          selected={!retreatId}
          onPress={() => {
            setRetreatId(undefined);
            AsyncStorage.removeItem(RETREAT_KEY).catch(() => undefined);
            setPicker(false);
          }}
        />
        {retreats.map((item) => (
          <SheetOption
            key={item.id}
            label={item.title}
            description={`${item.dateRange} · ${item.status}`}
            selected={item.id === retreatId}
            onPress={() => {
              setRetreatId(item.id);
              setPicker(false);
            }}
          />
        ))}
      </Sheet>

      <Sheet visible={manual} onClose={() => setManual(false)} title="Enter ticket code">
        <View style={{ gap: space.md }}>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.toUpperCase())}
            placeholder="DMRC-XXXXXXXX"
            placeholderTextColor={colors.subtle}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            style={styles.codeInput}
            returnKeyType="go"
            onSubmitEditing={() => {
              if (!code.trim()) return;
              setManual(false);
              submit({ ticketCode: code.trim() });
              setCode('');
            }}
          />
          <Button
            label="Check in"
            icon="enter-outline"
            disabled={!code.trim()}
            onPress={() => {
              setManual(false);
              submit({ ticketCode: code.trim() });
              setCode('');
            }}
          />
        </View>
      </Sheet>

      <Sheet visible={guests} onClose={() => setGuests(false)} title={`Still to arrive (${stats?.expected.length ?? 0})`}>
        <View style={{ gap: space.sm }}>
          <SearchField value={filter} onChangeText={setFilter} placeholder="Search guests" />
          {expected.slice(0, 80).map((guest) => (
            <SheetOption
              key={guest.id}
              label={guest.fullName}
              description={`${guest.phone}${guest.partySize > 1 ? ` · party of ${guest.partySize}` : ''}${guest.ticketCode ? ` · ${guest.ticketCode}` : ''}`}
              icon="person-circle-outline"
              onPress={() => {
                setGuests(false);
                submit({ bookingId: guest.id });
              }}
            />
          ))}
          {stats && !expected.length ? (
            <Text variant="small" center style={{ padding: space.xl }}>
              {stats.expected.length ? 'No guest matches your search.' : 'Everyone with an approved booking has arrived.'}
            </Text>
          ) : null}
          {stats?.recent.length ? (
            <>
              <Text variant="caption" style={{ marginTop: space.md }}>
                Recently arrived
              </Text>
              {stats.recent.map((guest) => (
                <SheetOption
                  key={guest.id}
                  label={guest.fullName}
                  description={`In at ${formatTime(guest.checkedInAt)}${guest.partySize > 1 ? ` · party of ${guest.partySize}` : ''} · tap to undo`}
                  icon="checkmark-circle"
                  onPress={() => {
                    setGuests(false);
                    submit({ bookingId: guest.id, undo: true });
                  }}
                />
              ))}
            </>
          ) : null}
        </View>
      </Sheet>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Viewfinder({ active }: { active: boolean }) {
  const line = useSharedValue(0);
  useEffect(() => {
    line.set(withRepeat(withTiming(1, { duration: 1800 }), -1, true));
  }, [line]);
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: line.get() * (FRAME - 20) }], opacity: active ? 1 : 0 }));
  const corner = (position: object) => <View style={[styles.corner, position]} />;
  return (
    <View style={styles.frame}>
      {corner({ top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 22 })}
      {corner({ top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 22 })}
      {corner({ bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 22 })}
      {corner({ bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 22 })}
      <Animated.View style={[styles.scanLine, lineStyle]} />
      <Text variant="small" color={colors.navy100} center style={styles.hint}>
        Point at the QR code on the ticket
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy950 },
  shade: { backgroundColor: 'rgba(10,20,38,0.35)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg },
  retreatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(10,20,38,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  stats: {
    flexDirection: 'row',
    marginHorizontal: space.lg,
    marginTop: space.md,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(10,20,38,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue: { fontFamily: fonts.bold, fontSize: 20, color: colors.white },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.navy200, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: TAB_BAR_SPACE },
  frame: { width: FRAME, height: FRAME },
  corner: { position: 'absolute', width: 46, height: 46, borderColor: colors.gold300 },
  scanLine: { position: 'absolute', left: 14, right: 14, top: 10, height: 2, borderRadius: 2, backgroundColor: colors.gold300 },
  hint: { position: 'absolute', bottom: -36, left: -40, right: -40 },
  permission: { alignItems: 'center', gap: space.sm, paddingHorizontal: space.xxxl },
  actions: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', gap: space.sm },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(10,20,38,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  actionLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },
  result: { position: 'absolute', left: space.lg, right: space.lg, borderRadius: radius.xl, padding: space.xl, gap: space.md },
  codeInput: {
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: space.lg,
    fontFamily: fonts.semibold,
    fontSize: 20,
    letterSpacing: 2,
    color: colors.ink,
    textAlign: 'center',
  },
});
