import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BrawnHeader } from '@/components/BrawnHeader';
import { useAuth } from '@/auth/AuthProvider';
import { apiRequest } from '@/api/client';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

type DashboardData = {
  occupancyCount: number;
  membership: null | {
    subscriptionId: string;
    planId: string;
    planName: string;
    planCode: string;
    status: string;
    startsAt: string;
    endsAt: string;
    price: number;
    discount: number;
    currency: string;
    durationDays: number;
    daysRemaining: number;
  };
  membershipWarning: null | {
    level: 'ONE_DAY' | 'SEVEN_DAYS';
    daysRemaining: number;
    message: string;
  };
  nextSession: null | {
    id: string;
    startsAt: string;
    durationMinutes: number;
    sessionType: string;
    trainerName: string;
  };
};

export default function MemberHome() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const name = user?.firstName || user?.username || 'Member';

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await apiRequest<DashboardData>('/mobile-auth/member/dashboard');
      setData(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void load();
    const timer = setInterval(() => { void load(); }, 30000);
    return () => clearInterval(timer);
  }, [load]));

  const sessionDate = data?.nextSession ? new Date(data.nextSession.startsAt) : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrawnHeader label="MEMBER" />
        <Text style={styles.kicker}>YOUR GYM, LIVE</Text>
        <Text style={styles.title}>Ready to train, {name}?</Text>

        {data?.membershipWarning ? (
          <Pressable style={[styles.warningCard, data.membershipWarning.level === 'ONE_DAY' && styles.warningCritical]} onPress={() => router.push('/(member)/membership')}>
            <Ionicons name="warning-outline" size={22} color={data.membershipWarning.level === 'ONE_DAY' ? '#ff6b65' : '#efb458'} />
            <View style={styles.flex}>
              <Text style={styles.warningTitle}>{data.membershipWarning.level === 'ONE_DAY' ? 'MEMBERSHIP EXPIRES TOMORROW' : 'MEMBERSHIP EXPIRING SOON'}</Text>
              <Text style={styles.warningText}>{data.membershipWarning.message} Tap to review your membership.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ) : null}

        <View style={styles.liveRow}>
          <View style={styles.occupancyCard}>
            <View style={styles.liveDot} />
            <Text style={styles.cardLabel}>IN THE GYM NOW</Text>
            {loading && !data ? <ActivityIndicator style={styles.occupancyLoader} color={colors.accent} /> : <Text style={styles.occupancyNumber}>{data?.occupancyCount ?? 0}</Text>}
            <Text style={styles.muted}>people currently checked in</Text>
          </View>

          <Pressable style={styles.membershipCard} onPress={() => router.push('/(member)/membership')}>
            <View style={styles.membershipHeader}>
              <Text style={styles.cardLabel}>MEMBERSHIP</Text>
              {data?.membership ? <View style={styles.activePill}><Text style={styles.activeText}>ACTIVE</Text></View> : null}
            </View>
            <Text numberOfLines={2} style={styles.membershipName}>{data?.membership?.planName ?? 'No active pass'}</Text>
            <Text style={styles.muted}>{data?.membership ? `${data.membership.daysRemaining} days remaining` : 'Contact your gym to activate a membership'}</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.checkIn}>
          <View style={styles.checkIcon}><Ionicons name="qr-code-outline" size={28} color="#fff" /></View>
          <View style={styles.flex}><Text style={styles.checkTitle}>CHECK IN</Text><Text style={styles.checkText}>Open your gym access code</Text></View>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NEXT UP</Text>
          <Pressable onPress={() => router.push('/(member)/schedule')}><Text style={styles.seeAll}>VIEW SCHEDULE</Text></Pressable>
        </View>

        {data?.nextSession && sessionDate ? (
          <View style={styles.sessionCard}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateDay}>{sessionDate.getDate()}</Text>
              <Text style={styles.dateMonth}>{sessionDate.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.sessionType}>{data.nextSession.sessionType}</Text>
              <Text style={styles.muted}>{sessionDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {data.nextSession.durationMinutes} min</Text>
              <Text style={styles.trainer}>with {data.nextSession.trainerName}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.muted} />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-clear-outline" size={24} color={colors.muted} />
            <Text style={styles.emptyTitle}>No upcoming PT session</Text>
            <Text style={styles.muted}>Your next scheduled personal-training session will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2.2, marginTop: 38 },
  title: { color: colors.foreground, fontSize: 31, lineHeight: 37, fontWeight: '900', letterSpacing: -1.1, marginTop: 7, marginBottom: 22 },
  warningCard: { borderRadius: radii.lg, borderWidth: 1, borderColor: 'rgba(239,180,88,.3)', backgroundColor: 'rgba(239,180,88,.07)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 },
  warningCritical: { borderColor: 'rgba(255,89,89,.35)', backgroundColor: 'rgba(255,89,89,.07)' },
  warningTitle: { color: colors.foreground, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  warningText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  liveRow: { flexDirection: 'row', gap: 12 },
  occupancyCard: { flex: .85, minHeight: 150, borderRadius: radii.lg, padding: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(21,24,21,.88)' },
  membershipCard: { flex: 1.15, minHeight: 150, borderRadius: radii.lg, padding: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(21,24,21,.88)' },
  membershipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#55d98c', marginBottom: 9 },
  cardLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  occupancyNumber: { color: colors.foregroundStrong, fontSize: 43, fontWeight: '900', letterSpacing: -2, marginTop: 17, marginBottom: 2 },
  occupancyLoader: { alignSelf: 'flex-start', marginTop: 28, marginBottom: 17 },
  membershipName: { color: colors.foregroundStrong, fontSize: 18, lineHeight: 22, fontWeight: '800', marginTop: 24, marginBottom: 7 },
  muted: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  activePill: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: 'rgba(101,211,142,0.12)' },
  activeText: { color: colors.success, fontWeight: '900', fontSize: 7, letterSpacing: 1 },
  error: { color: colors.danger, fontSize: 11, marginTop: 10 },
  checkIn: { marginTop: 14, borderRadius: radii.lg, minHeight: 82, padding: 15, flexDirection: 'row', gap: 13, alignItems: 'center', backgroundColor: colors.accent },
  checkIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.10)', alignItems: 'center', justifyContent: 'center' },
  checkTitle: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1.2 },
  checkText: { color: 'rgba(255,255,255,.75)', fontSize: 11, marginTop: 3 },
  flex: { flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 12 },
  sectionTitle: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2.1 },
  seeAll: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  sessionCard: { borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: '#0d0f0e', flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateBlock: { width: 54, height: 62, borderRadius: 14, backgroundColor: 'rgba(255,59,59,0.10)', alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.foreground, fontSize: 22, fontWeight: '900' },
  dateMonth: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  sessionType: { color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 5 },
  trainer: { color: '#c8cbc5', fontSize: 11, marginTop: 7 },
  emptyCard: { borderRadius: radii.lg, padding: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: '#0d0f0e', alignItems: 'flex-start', gap: 7 },
  emptyTitle: { color: colors.foreground, fontSize: 14, fontWeight: '800' },
});
