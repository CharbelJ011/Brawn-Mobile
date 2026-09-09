import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { BrawnHeader } from '@/components/BrawnHeader';
import { useAuth } from '@/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

export default function MemberHome() {
  const { user } = useAuth();
  const name = user?.firstName || user?.username || 'Member';
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrawnHeader label="MEMBER" />
        <Text style={styles.kicker}>GOOD MORNING</Text>
        <Text style={styles.title}>Ready to train, {name}?</Text>

        <View style={styles.membershipCard}>
          <View>
            <Text style={styles.cardLabel}>MEMBERSHIP</Text>
            <Text style={styles.membershipName}>Brawn Unlimited</Text>
            <Text style={styles.muted}>Active · 40 days remaining</Text>
          </View>
          <View style={styles.activePill}><Text style={styles.activeText}>ACTIVE</Text></View>
        </View>

        <Pressable style={styles.checkIn}>
          <View style={styles.checkIcon}><Ionicons name="qr-code-outline" size={28} color="#10120f" /></View>
          <View style={styles.flex}><Text style={styles.checkTitle}>CHECK IN</Text><Text style={styles.checkText}>Open your gym access code</Text></View>
          <Ionicons name="chevron-forward" size={22} color="#10120f" />
        </Pressable>

        <Text style={styles.sectionTitle}>NEXT UP</Text>
        <View style={styles.sessionCard}>
          <View style={styles.dateBlock}><Text style={styles.dateDay}>10</Text><Text style={styles.dateMonth}>SEP</Text></View>
          <View style={styles.flex}><Text style={styles.sessionType}>Personal Training</Text><Text style={styles.muted}>6:00 PM · 60 min</Text><Text style={styles.trainer}>with your trainer</Text></View>
          <Ionicons name="arrow-forward" size={20} color={colors.muted} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2.2, marginTop: 38 },
  title: { color: colors.foreground, fontSize: 31, lineHeight: 37, fontWeight: '850', letterSpacing: -1.1, marginTop: 7, marginBottom: 26 },
  membershipCard: { minHeight: 130, borderRadius: radii.lg, padding: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(21,24,21,0.88)', flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  membershipName: { color: colors.foregroundStrong, fontSize: 21, fontWeight: '800', marginTop: 22, marginBottom: 5 },
  muted: { color: colors.muted, fontSize: 12 },
  activePill: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(101,211,142,0.12)' },
  activeText: { color: colors.success, fontWeight: '900', fontSize: 9, letterSpacing: 1.2 },
  checkIn: { marginTop: 14, borderRadius: radii.lg, minHeight: 82, padding: 15, flexDirection: 'row', gap: 13, alignItems: 'center', backgroundColor: colors.accent },
  checkIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  checkTitle: { color: '#10120f', fontWeight: '950', fontSize: 14, letterSpacing: 1.2 },
  checkText: { color: 'rgba(16,18,15,0.72)', fontSize: 11, marginTop: 3 },
  flex: { flex: 1 },
  sectionTitle: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2.1, marginTop: 34, marginBottom: 12 },
  sessionCard: { borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: '#0d0f0e', flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateBlock: { width: 54, height: 62, borderRadius: 14, backgroundColor: 'rgba(255,59,59,0.10)', alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.foreground, fontSize: 22, fontWeight: '900' },
  dateMonth: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  sessionType: { color: colors.foreground, fontSize: 15, fontWeight: '800', marginBottom: 5 },
  trainer: { color: '#c8cbc5', fontSize: 11, marginTop: 8 },
});
