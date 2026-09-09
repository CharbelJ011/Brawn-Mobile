import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BrawnHeader } from '@/components/BrawnHeader';
import { apiRequest } from '@/api/client';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

type MembershipData = {
  current: null | {
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
  warning: null | {
    level: 'ONE_DAY' | 'SEVEN_DAYS';
    daysRemaining: number;
    message: string;
  };
  plans: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    durationDays: number;
    price: number;
    currency: string;
  }>;
  renewalMode: 'POS_ONLY';
};

type RenewalRequest = {
  id: string;
  status: string;
  requestedAt: string;
  membershipPlanId: string;
  planName: string;
  planCode: string;
  price: number;
  currency: string;
};

export default function MembershipScreen() {
  const [data, setData] = useState<MembershipData | null>(null);
  const [renewals, setRenewals] = useState<RenewalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [membership, requests] = await Promise.all([
        apiRequest<MembershipData>('/mobile-auth/member/membership'),
        apiRequest<RenewalRequest[]>('/mobile-auth/member/membership/renewals'),
      ]);
      setData(membership);
      setRenewals(requests);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load membership data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void load();
  }, [load]));

  const pendingByPlan = useMemo(() => new Map(renewals.filter((item) => item.status === 'PENDING').map((item) => [item.membershipPlanId, item])), [renewals]);

  async function requestRenewal(planId: string) {
    if (busyPlanId) return;
    setBusyPlanId(planId);
    setError('');
    setSuccess('');
    try {
      await apiRequest('/mobile-auth/member/membership/renewals', { method: 'POST', body: JSON.stringify({ planId }) });
      setSuccess('Renewal request sent to the gym POS. Your membership will activate only after payment is completed.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to request renewal.');
    } finally {
      setBusyPlanId(null);
    }
  }

  async function cancelRenewal(requestId: string, planId: string) {
    if (busyPlanId) return;
    setBusyPlanId(planId);
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/mobile-auth/member/membership/renewals/${requestId}`, { method: 'DELETE' });
      setSuccess('Pending POS renewal request cancelled.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to cancel renewal request.');
    } finally {
      setBusyPlanId(null);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrawnHeader label="MEMBER" />
        <Text style={styles.kicker}>YOUR PASS</Text>
        <Text style={styles.title}>Membership</Text>
        <Text style={styles.subtitle}>Your membership and available plans are pulled directly from Brawn ERP.</Text>

        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.muted}>Loading membership…</Text></View> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        {!loading && data?.warning ? (
          <View style={[styles.warning, data.warning.level === 'ONE_DAY' && styles.warningCritical]}>
            <Ionicons name="warning-outline" size={23} color={data.warning.level === 'ONE_DAY' ? '#ff6b65' : '#efb458'} />
            <View style={styles.flex}>
              <Text style={styles.warningTitle}>{data.warning.level === 'ONE_DAY' ? 'EXPIRES WITHIN 1 DAY' : 'EXPIRING WITHIN 7 DAYS'}</Text>
              <Text style={styles.warningText}>{data.warning.message}</Text>
            </View>
          </View>
        ) : null}

        {!loading && data?.current ? (
          <View style={styles.currentCard}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardLabel}>ACTIVE MEMBERSHIP</Text>
                <Text style={styles.planName}>{data.current.planName}</Text>
              </View>
              <View style={styles.activePill}><Text style={styles.activeText}>ACTIVE</Text></View>
            </View>
            <View style={styles.daysRow}>
              <Text style={styles.daysNumber}>{data.current.daysRemaining}</Text>
              <View><Text style={styles.daysLabel}>DAYS</Text><Text style={styles.muted}>remaining</Text></View>
            </View>
            <View style={styles.infoTable}>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Started</Text><Text style={styles.infoValue}>{new Date(data.current.startsAt).toLocaleDateString()}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Expires</Text><Text style={styles.infoValue}>{new Date(data.current.endsAt).toLocaleDateString()}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Plan duration</Text><Text style={styles.infoValue}>{data.current.durationDays} days</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>ERP plan code</Text><Text style={styles.infoValue}>{data.current.planCode}</Text></View>
            </View>
          </View>
        ) : !loading ? (
          <View style={styles.empty}><Text style={styles.emptyTitle}>No active membership</Text><Text style={styles.muted}>Choose one of the gym's available plans below.</Text></View>
        ) : null}

        {!loading && data ? (
          <>
            <Text style={styles.sectionTitle}>AVAILABLE PLANS</Text>
            {data.plans.map((plan) => {
              const pending = pendingByPlan.get(plan.id);
              return (
                <View key={plan.id} style={[styles.planCard, pending && styles.planCardPending]}>
                  <View style={styles.planHeader}>
                    <View style={styles.flex}><Text style={styles.planCardName}>{plan.name}</Text><Text style={styles.planCode}>{plan.code}</Text></View>
                    <Text style={styles.planPrice}>{plan.price} {plan.currency}</Text>
                  </View>
                  {plan.description ? <Text style={styles.planDescription}>{plan.description}</Text> : null}
                  <View style={styles.planBottomRow}>
                    <Text style={styles.planDuration}>{plan.durationDays} DAYS</Text>
                    {pending ? <View style={styles.pendingPill}><Text style={styles.pendingText}>POS PENDING</Text></View> : null}
                  </View>
                  <Pressable
                    onPress={() => pending ? cancelRenewal(pending.id, plan.id) : requestRenewal(plan.id)}
                    disabled={busyPlanId === plan.id}
                    style={({ pressed }) => [styles.renewButton, pending && styles.cancelButton, pressed && styles.pressed]}
                  >
                    {busyPlanId === plan.id ? <ActivityIndicator color={pending ? colors.accent : '#fff'} /> : <Text style={[styles.renewText, pending && styles.cancelText]}>{pending ? 'CANCEL POS REQUEST' : 'RENEW THROUGH POS'}</Text>}
                  </Pressable>
                </View>
              );
            })}
            <View style={styles.posNotice}>
              <Ionicons name="card-outline" size={22} color={colors.accent} />
              <View style={styles.flex}>
                <Text style={styles.posTitle}>PHONE INITIATED · POS SETTLED</Text>
                <Text style={styles.posText}>Choosing a plan creates a real renewal request in Brawn ERP. The subscription is not activated until the gym completes the payment through POS.</Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 38 },
  title: { color: colors.foreground, fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 24 },
  loading: { minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  error: { color: colors.danger, fontSize: 11, marginBottom: 12 },
  success: { color: '#55d98c', fontSize: 11, marginBottom: 12 },
  flex: { flex: 1 },
  warning: { flexDirection: 'row', gap: 11, borderWidth: 1, borderColor: 'rgba(239,180,88,.3)', backgroundColor: 'rgba(239,180,88,.07)', borderRadius: radii.lg, padding: 14, marginBottom: 13 },
  warningCritical: { borderColor: 'rgba(255,89,89,.35)', backgroundColor: 'rgba(255,89,89,.07)' },
  warningTitle: { color: colors.foreground, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  warningText: { color: colors.muted, fontSize: 11, marginTop: 4 },
  currentCard: { borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(17,19,17,.92)', borderRadius: radii.xl, padding: 20 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  planName: { color: colors.foregroundStrong, fontSize: 22, fontWeight: '900', marginTop: 7 },
  activePill: { borderRadius: 99, backgroundColor: 'rgba(85,217,140,.09)', paddingHorizontal: 9, paddingVertical: 6 },
  activeText: { color: '#55d98c', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 25, marginBottom: 19 },
  daysNumber: { color: colors.accent, fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  daysLabel: { color: colors.foreground, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  infoTable: { borderTopWidth: 1, borderTopColor: colors.line },
  infoRow: { minHeight: 43, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoLabel: { color: colors.muted, fontSize: 10 },
  infoValue: { color: colors.foreground, fontSize: 11, fontWeight: '800' },
  empty: { borderWidth: 1, borderColor: colors.line, borderRadius: radii.lg, padding: 20 },
  emptyTitle: { color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  sectionTitle: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginTop: 28, marginBottom: 10 },
  planCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radii.lg, backgroundColor: '#0d0f0e', padding: 16, marginBottom: 9 },
  planCardPending: { borderColor: 'rgba(239,180,88,.25)' },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  planCardName: { color: colors.foreground, fontSize: 15, fontWeight: '800' },
  planCode: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  planPrice: { color: colors.foregroundStrong, fontSize: 14, fontWeight: '900' },
  planDescription: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 9 },
  planBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 },
  planDuration: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  pendingPill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: 'rgba(239,180,88,.08)' },
  pendingText: { color: '#efb458', fontSize: 7, fontWeight: '900', letterSpacing: .9 },
  renewButton: { height: 44, borderRadius: radii.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  cancelButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,59,59,.4)' },
  pressed: { transform: [{ scale: .99 }] },
  renewText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  cancelText: { color: colors.accent },
  posNotice: { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: 'rgba(255,59,59,.2)', backgroundColor: 'rgba(255,59,59,.04)', borderRadius: radii.lg, padding: 15, marginTop: 5 },
  posTitle: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  posText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
});
