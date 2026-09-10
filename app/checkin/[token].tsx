import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BrandMark } from '@/components/BrandMark';
import { useAuth } from '@/auth/AuthProvider';
import { apiRequest } from '@/api/client';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

type NfcCheckinResult = {
  success: boolean;
  alreadyCheckedIn?: boolean;
  attendanceId?: string | null;
  checkedInAt?: string;
  gymName?: string;
  locationId?: string;
  locationName?: string;
  message?: string;
  validation?: { decision?: string; code?: string | null; message?: string | null } | null;
};

type State = 'idle' | 'checking' | 'success' | 'error';

export default function NfcCheckinScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const { user, loading } = useAuth();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [state, setState] = useState<State>('idle');
  const [result, setResult] = useState<NfcCheckinResult | null>(null);
  const [error, setError] = useState('');
  const attempted = useRef(false);

  const isMember = user?.userType === 'MEMBER' || Boolean(user?.memberId);

  useEffect(() => {
    if (loading || !user || !isMember || !token || attempted.current) return;
    attempted.current = true;
    setState('checking');
    setError('');

    apiRequest<NfcCheckinResult>(`/mobile-auth/member/check-in/nfc/${encodeURIComponent(token)}`, {
      method: 'POST',
    })
      .then((payload) => {
        setResult(payload);
        setState('success');
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : 'Unable to check in with this NFC tag.');
        setState('error');
      });
  }, [isMember, loading, token, user]);

  function retry() {
    attempted.current = false;
    setState('idle');
    setError('');
    setResult(null);
  }

  if (loading) {
    return <Screen><View style={styles.center}><ActivityIndicator color={colors.accent} /><Text style={styles.muted}>Opening Brawn check-in…</Text></View></Screen>;
  }

  if (!user) {
    return <Screen><View style={styles.center}>
      <BrandMark size={54} />
      <Text style={styles.kicker}>NFC CHECK-IN</Text>
      <Text style={styles.title}>Sign in first</Text>
      <Text style={styles.muted}>Your Brawn session has expired. Sign in, then tap the NFC tag again.</Text>
      <Pressable style={styles.primary} onPress={() => router.replace('/(auth)/login')}><Text style={styles.primaryText}>SIGN IN</Text></Pressable>
    </View></Screen>;
  }

  if (!isMember) {
    return <Screen><View style={styles.center}>
      <Ionicons name="person-outline" size={44} color={colors.accent} />
      <Text style={styles.kicker}>NFC CHECK-IN</Text>
      <Text style={styles.title}>Member check-in only</Text>
      <Text style={styles.muted}>This NFC tag checks gym members in. Staff accounts are not checked in through the member attendance flow.</Text>
      <Pressable style={styles.secondary} onPress={() => router.replace('/(trainer)')}><Text style={styles.secondaryText}>BACK TO BRAWN</Text></Pressable>
    </View></Screen>;
  }

  if (!token) {
    return <Screen><View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={46} color={colors.danger} />
      <Text style={styles.title}>Invalid NFC link</Text>
      <Text style={styles.muted}>This tag does not contain a Brawn location token.</Text>
      <Pressable style={styles.secondary} onPress={() => router.replace('/(member)')}><Text style={styles.secondaryText}>BACK HOME</Text></Pressable>
    </View></Screen>;
  }

  if (state === 'checking' || state === 'idle') {
    return <Screen><View style={styles.center}>
      <View style={styles.iconCircle}><Ionicons name="radio-outline" size={34} color={colors.accent} /></View>
      <Text style={styles.kicker}>BRAWN NFC</Text>
      <Text style={styles.title}>Checking you in…</Text>
      <ActivityIndicator style={styles.spinner} color={colors.accent} />
      <Text style={styles.muted}>Validating your membership and gym location.</Text>
    </View></Screen>;
  }

  if (state === 'success' && result) {
    return <Screen><View style={styles.center}>
      <View style={styles.successCircle}><Ionicons name="checkmark" size={48} color="#07140d" /></View>
      <Text style={styles.kicker}>CHECK-IN COMPLETE</Text>
      <Text style={styles.title}>{result.alreadyCheckedIn ? 'Already checked in' : 'Welcome in'}</Text>
      <Text style={styles.location}>{result.locationName ?? result.gymName ?? 'Brawn gym'}</Text>
      <Text style={styles.muted}>{result.message ?? result.validation?.message ?? 'Your attendance has been recorded in Brawn ERP.'}</Text>
      <Pressable style={styles.primary} onPress={() => router.replace('/(member)')}><Text style={styles.primaryText}>GO TO HOME</Text></Pressable>
    </View></Screen>;
  }

  return <Screen><View style={styles.center}>
    <View style={styles.errorCircle}><Ionicons name="close" size={42} color="#fff" /></View>
    <Text style={styles.kicker}>CHECK-IN FAILED</Text>
    <Text style={styles.title}>Couldn’t check you in</Text>
    <Text style={styles.muted}>{error || 'This NFC tag could not be validated.'}</Text>
    <Pressable style={styles.primary} onPress={retry}><Text style={styles.primaryText}>TRY AGAIN</Text></Pressable>
    <Pressable style={styles.secondary} onPress={() => router.replace('/(member)')}><Text style={styles.secondaryText}>BACK HOME</Text></Pressable>
  </View></Screen>;
}

const styles = StyleSheet.create({
  center: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2.1, marginTop: 18 },
  title: { color: colors.foregroundStrong, fontSize: 29, fontWeight: '900', letterSpacing: -1, textAlign: 'center', marginTop: 7 },
  location: { color: colors.foreground, fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  muted: { maxWidth: 330, color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 10 },
  spinner: { marginTop: 20 },
  iconCircle: { width: 74, height: 74, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,59,59,.3)', backgroundColor: 'rgba(255,59,59,.07)', alignItems: 'center', justifyContent: 'center' },
  successCircle: { width: 78, height: 78, borderRadius: 26, backgroundColor: '#55d98c', alignItems: 'center', justifyContent: 'center' },
  errorCircle: { width: 78, height: 78, borderRadius: 26, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  primary: { minWidth: 210, height: 52, marginTop: 24, paddingHorizontal: 24, borderRadius: radii.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  secondary: { minWidth: 210, height: 48, marginTop: 10, paddingHorizontal: 20, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.foreground, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
});
