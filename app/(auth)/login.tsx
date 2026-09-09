import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BrandMark } from '@/components/BrandMark';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError, apiRequest } from '@/api/client';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type GymOption = { id: string; name: string; slug: string };

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [gyms, setGyms] = useState<GymOption[]>([]);
  const [gym, setGym] = useState<GymOption | null>(null);
  const [gymPickerOpen, setGymPickerOpen] = useState(false);
  const [loadingGyms, setLoadingGyms] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log('[Brawn Login] login screen mounted');
    console.log('[Brawn Login] loading gyms from /mobile-auth/gyms');

    apiRequest<GymOption[]>('/mobile-auth/gyms')
      .then((items) => {
        console.log('[Brawn Login] gyms loaded:', items.map((item) => ({ id: item.id, name: item.name, slug: item.slug })));
        setGyms(items);
        if (items.length === 1) {
          console.log('[Brawn Login] one gym found, auto-selecting:', items[0].name);
          setGym(items[0]);
        }
      })
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status && caught.status < 500) {
          console.warn('[Brawn Login] gym request rejected:', { status: caught.status, message: caught.message });
        } else {
          console.error('[Brawn Login] gym request failed:', caught);
        }
        setError(caught instanceof Error ? caught.message : 'Unable to load gyms.');
      })
      .finally(() => {
        console.log('[Brawn Login] gym loading finished');
        setLoadingGyms(false);
      });
  }, []);

  async function submit() {
    if (!gym) { setError('Choose your gym first.'); return; }
    if (!username.trim() || !password) return;
    setSubmitting(true);
    setError('');
    console.log('[Brawn Login] sign-in attempt:', { gymId: gym.id, gymName: gym.name, username: username.trim() });
    try {
      const user = await signIn({ gymId: gym.id, username: username.trim(), password, remember: true });
      console.log('[Brawn Login] sign-in success:', { memberId: user.memberId, gymId: user.gymId, userType: user.userType });
      router.replace(user.userType === 'MEMBER' || user.memberId ? '/(member)' : '/(trainer)');
    } catch (caught) {
      if (caught instanceof ApiError && (caught.status === 401 || caught.status === 403)) {
        console.log('[Brawn Login] credentials rejected for selected gym');
      } else if (caught instanceof ApiError && caught.status && caught.status < 500) {
        console.warn('[Brawn Login] sign-in rejected:', { status: caught.status, message: caught.message });
      } else {
        console.error('[Brawn Login] sign-in failed:', caught);
      }
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.content}>
          <View style={styles.brandStage}>
            <View style={styles.markCircle}><BrandMark size={72} /></View>
            <Text style={styles.wordmark}>BRAWN</Text>
            <Text style={styles.tagline}>STRENGTH BEHIND EVERY OPERATION.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.heading}>Sign in to Brawn</Text>
            <Text style={styles.subheading}>Choose your gym, then use the mobile credentials created for your member account.</Text>

            <Text style={styles.label}>Gym</Text>
            <Pressable onPress={() => !loadingGyms && setGymPickerOpen(true)} style={styles.selector}>
              <Text style={gym ? styles.selectorText : styles.selectorPlaceholder}>
                {loadingGyms ? 'Loading gyms...' : gym?.name ?? 'Select your gym'}
              </Text>
              <Text style={styles.chevron}>⌄</Text>
            </Pressable>

            <Text style={[styles.label, styles.fieldLabel]}>Username</Text>
            <TextInput
              value={username}
              onChangeText={(value) => { setUsername(value); if (error) setError(''); }}
              placeholder="e.g. john.doe"
              placeholderTextColor={colors.mutedDark}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={[styles.label, styles.fieldLabel]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={(value) => { setPassword(value); if (error) setError(''); }}
              placeholder="Enter your password"
              placeholderTextColor={colors.mutedDark}
              secureTextEntry
              style={styles.input}
              onSubmitEditing={submit}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable onPress={submit} disabled={submitting || loadingGyms} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              {submitting ? <ActivityIndicator color="#10120f" /> : <Text style={styles.buttonText}>SIGN IN</Text>}
            </Pressable>
          </View>

          <Text style={styles.footer}>BUILT FOR PEOPLE WHO BUILD STRENGTH</Text>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={gymPickerOpen} transparent animationType="fade" onRequestClose={() => setGymPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setGymPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalEyebrow}>YOUR GYM</Text>
            <Text style={styles.modalTitle}>Choose where you train</Text>
            <ScrollView style={styles.gymList}>
              {gyms.map((item) => (
                <Pressable key={item.id} onPress={() => { setGym(item); setGymPickerOpen(false); setError(''); }} style={[styles.gymOption, gym?.id === item.id && styles.gymOptionSelected]}>
                  <View>
                    <Text style={styles.gymName}>{item.name}</Text>
                    <Text style={styles.gymSlug}>{item.slug}</Text>
                  </View>
                  {gym?.id === item.id ? <Text style={styles.selectedMark}>✓</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 14, justifyContent: 'center' },
  brandStage: { alignItems: 'center', marginBottom: 28 },
  markCircle: { width: 96, height: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  wordmark: { color: colors.foregroundStrong, fontSize: 62, lineHeight: 62, fontWeight: '900', letterSpacing: -5.4 },
  tagline: { marginTop: 12, color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 2.1 },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radii.xl, padding: spacing.lg, backgroundColor: 'rgba(19,21,19,0.88)' },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2.2, marginBottom: 7 },
  heading: { color: colors.foreground, fontSize: 24, fontWeight: '800', letterSpacing: -0.7 },
  subheading: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 24 },
  label: { color: '#c8cbc5', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  fieldLabel: { marginTop: 16 },
  input: { height: 52, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, paddingHorizontal: 15, backgroundColor: 'rgba(4,5,4,0.72)', color: colors.foreground, fontSize: 15 },
  selector: { height: 52, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, paddingHorizontal: 15, backgroundColor: 'rgba(4,5,4,0.72)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorText: { color: colors.foreground, fontSize: 15, fontWeight: '700' },
  selectorPlaceholder: { color: colors.mutedDark, fontSize: 15 },
  chevron: { color: colors.muted, fontSize: 20, marginTop: -5 },
  error: { color: colors.danger, fontSize: 12, fontWeight: '700', marginTop: 12 },
  button: { height: 54, marginTop: 20, borderRadius: radii.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  buttonPressed: { transform: [{ scale: 0.99 }], backgroundColor: colors.accentSoft },
  buttonText: { color: '#10120f', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  footer: { alignSelf: 'center', marginTop: 22, color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: '800', letterSpacing: 1.8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)', padding: 16 },
  modalCard: { maxHeight: '70%', borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: '#111311', padding: 18 },
  modalEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  modalTitle: { color: colors.foreground, fontSize: 21, fontWeight: '800', marginTop: 5, marginBottom: 14 },
  gymList: { maxHeight: 360 },
  gymOption: { minHeight: 62, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.018)' },
  gymOptionSelected: { borderColor: 'rgba(255,59,59,0.55)', backgroundColor: 'rgba(255,59,59,0.07)' },
  gymName: { color: colors.foreground, fontSize: 14, fontWeight: '800' },
  gymSlug: { color: colors.muted, fontSize: 11, marginTop: 3 },
  selectedMark: { color: colors.accent, fontSize: 17, fontWeight: '900' },
});
