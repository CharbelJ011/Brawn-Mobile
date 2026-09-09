import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BrandMark } from '@/components/BrandMark';
import { useAuth } from '@/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!username.trim() || !password) return;
    setSubmitting(true);
    setError('');
    try {
      const user = await signIn({ username: username.trim(), password, remember: true });
      const member = user.userType === 'MEMBER' || Boolean(user.memberId);
      router.replace(member ? '/(member)' : '/(trainer)');
    } catch (caught) {
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
            <Text style={styles.subheading}>Your gym. Your schedule. Your progress.</Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={(value) => { setUsername(value); if (error) setError(''); }}
              placeholder="Enter your username"
              placeholderTextColor={colors.mutedDark}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
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

            <Pressable onPress={submit} disabled={submitting} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              {submitting ? <ActivityIndicator color="#10120f" /> : <Text style={styles.buttonText}>SIGN IN</Text>}
            </Pressable>
          </View>

          <Text style={styles.footer}>BUILT FOR PEOPLE WHO BUILD STRENGTH</Text>
        </View>
      </KeyboardAvoidingView>
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
  subheading: { color: colors.muted, fontSize: 13, marginTop: 7, marginBottom: 24 },
  label: { color: '#c8cbc5', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  passwordLabel: { marginTop: 16 },
  input: { height: 52, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, paddingHorizontal: 15, backgroundColor: 'rgba(4,5,4,0.72)', color: colors.foreground, fontSize: 15 },
  error: { color: colors.danger, fontSize: 12, fontWeight: '700', marginTop: 12 },
  button: { height: 54, marginTop: 20, borderRadius: radii.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  buttonPressed: { transform: [{ scale: 0.99 }], backgroundColor: colors.accentSoft },
  buttonText: { color: '#10120f', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  footer: { alignSelf: 'center', marginTop: 22, color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: '800', letterSpacing: 1.8 },
});
