import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BrawnHeader } from '@/components/BrawnHeader';
import { apiRequest } from '@/api/client';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

type GymClass = {
  id: string;
  title: string;
  classType: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  location: string | null;
  price: number;
  currency: string;
  notes: string | null;
  trainerId: string;
  trainerName: string;
  reservedCount: number;
  memberBookingId: string | null;
  memberBookingStatus: string | null;
  attending: boolean;
  spotsRemaining: number;
};

function DayHeading({ date }: { date: Date }) {
  return <Text style={styles.dayHeading}>{date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}</Text>;
}

export default function MemberSchedule() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setClasses(await apiRequest<GymClass[]>('/mobile-auth/member/schedule'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load gym classes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void load();
  }, [load]));

  const groups = useMemo(() => {
    const map = new Map<string, GymClass[]>();
    for (const item of classes) {
      const key = new Date(item.startsAt).toDateString();
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()];
  }, [classes]);

  async function toggleAttendance(item: GymClass) {
    if (busyId) return;
    setBusyId(item.id);
    setError('');
    try {
      await apiRequest(`/mobile-auth/member/classes/${item.id}/attend`, { method: item.attending ? 'DELETE' : 'POST' });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update class attendance.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrawnHeader label="MEMBER" />
        <Text style={styles.kicker}>GYM CALENDAR</Text>
        <Text style={styles.title}>Classes</Text>
        <Text style={styles.subtitle}>See your gym's upcoming classes and mark the ones you plan to attend.</Text>

        {error ? <View style={styles.errorCard}><Text style={styles.error}>{error}</Text></View> : null}

        {loading ? (
          <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.muted}>Loading classes…</Text></View>
        ) : groups.length === 0 ? (
          <View style={styles.empty}><Ionicons name="calendar-clear-outline" size={28} color={colors.muted} /><Text style={styles.emptyTitle}>No upcoming classes</Text><Text style={styles.muted}>New classes created by the gym will appear here automatically.</Text></View>
        ) : (
          groups.map(([dayKey, items]) => (
            <View key={dayKey} style={styles.dayGroup}>
              <DayHeading date={new Date(items[0].startsAt)} />
              {items.map((item) => {
                const starts = new Date(item.startsAt);
                const ends = new Date(item.endsAt);
                const full = item.spotsRemaining <= 0 && !item.attending;
                return (
                  <View key={item.id} style={[styles.classCard, item.attending && styles.classCardAttending]}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.time}>{starts.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
                      <Text style={styles.duration}>{Math.max(1, Math.round((ends.getTime() - starts.getTime()) / 60000))} MIN</Text>
                    </View>
                    <View style={styles.classBody}>
                      <View style={styles.classTopRow}>
                        <View style={styles.flex}>
                          <Text style={styles.classType}>{item.classType}</Text>
                          <Text style={styles.classTitle}>{item.title}</Text>
                        </View>
                        {item.attending ? <View style={styles.attendingPill}><Ionicons name="checkmark" size={11} color="#55d98c" /><Text style={styles.attendingText}>GOING</Text></View> : null}
                      </View>
                      <Text style={styles.detail}>with {item.trainerName}</Text>
                      {item.location ? <Text style={styles.detail}>{item.location}</Text> : null}
                      <View style={styles.metaRow}>
                        <Text style={styles.spots}>{item.spotsRemaining} {item.spotsRemaining === 1 ? 'spot' : 'spots'} left</Text>
                        {item.price > 0 ? <Text style={styles.price}>{item.price} {item.currency}</Text> : <Text style={styles.free}>INCLUDED</Text>}
                      </View>
                      <Pressable
                        disabled={full || busyId === item.id}
                        onPress={() => toggleAttendance(item)}
                        style={({ pressed }) => [styles.attendButton, item.attending && styles.cancelButton, full && styles.disabledButton, pressed && !full && styles.pressed]}
                      >
                        {busyId === item.id ? <ActivityIndicator color={item.attending ? colors.accent : '#fff'} /> : (
                          <Text style={[styles.attendText, item.attending && styles.cancelText, full && styles.disabledText]}>
                            {item.attending ? 'I CAN’T MAKE IT' : full ? 'CLASS FULL' : 'I’M ATTENDING'}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 38 },
  title: { color: colors.foreground, fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 25 },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
  errorCard: { borderWidth: 1, borderColor: 'rgba(255,89,89,.22)', borderRadius: radii.md, backgroundColor: 'rgba(255,89,89,.06)', padding: 12, marginBottom: 12 },
  error: { color: colors.danger, fontSize: 11 },
  muted: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  empty: { minHeight: 180, borderWidth: 1, borderColor: colors.line, borderRadius: radii.lg, padding: 22, alignItems: 'flex-start', justifyContent: 'center', gap: 8 },
  emptyTitle: { color: colors.foreground, fontSize: 15, fontWeight: '800' },
  dayGroup: { marginBottom: 24 },
  dayHeading: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.7, marginBottom: 10 },
  classCard: { borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(16,18,16,.92)', borderRadius: radii.lg, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 13 },
  classCardAttending: { borderColor: 'rgba(85,217,140,.25)', backgroundColor: 'rgba(85,217,140,.035)' },
  timeBlock: { width: 67, borderRightWidth: 1, borderRightColor: colors.line, paddingRight: 12 },
  time: { color: colors.foreground, fontSize: 13, fontWeight: '900' },
  duration: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: .8, marginTop: 5 },
  classBody: { flex: 1 },
  classTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  flex: { flex: 1 },
  classType: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  classTitle: { color: colors.foregroundStrong, fontSize: 16, fontWeight: '800', marginTop: 3 },
  attendingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, backgroundColor: 'rgba(85,217,140,.08)', paddingHorizontal: 7, paddingVertical: 5 },
  attendingText: { color: '#55d98c', fontSize: 7, fontWeight: '900', letterSpacing: .8 },
  detail: { color: colors.muted, fontSize: 10, marginTop: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  spots: { color: '#c7ccc7', fontSize: 10, fontWeight: '700' },
  price: { color: colors.foreground, fontSize: 10, fontWeight: '800' },
  free: { color: '#55d98c', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  attendButton: { height: 42, marginTop: 13, borderRadius: radii.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,59,59,.4)' },
  disabledButton: { backgroundColor: 'rgba(255,255,255,.05)' },
  pressed: { transform: [{ scale: .99 }] },
  attendText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  cancelText: { color: colors.accent },
  disabledText: { color: colors.muted },
});
