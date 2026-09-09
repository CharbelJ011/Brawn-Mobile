import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { BrandMark } from './BrandMark';
import { useAuth } from '@/auth/AuthProvider';
import { colors } from '@/theme/colors';

export function BrawnHeader({ label }: { label?: string }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const showSignOut = label === 'MEMBER' && pathname.includes('profile');

  function confirmSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out of Brawn?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void signOut().then(() => router.replace('/(auth)/login'));
        },
      },
    ]);
  }

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <BrandMark size={30} />
        <Text style={styles.wordmark}>BRAWN</Text>
      </View>
      <View style={styles.actions}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {showSignOut ? (
          <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]} accessibilityRole="button" accessibilityLabel="Sign out">
            <Ionicons name="log-out-outline" size={18} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { color: colors.foregroundStrong, fontWeight: '900', fontSize: 20, letterSpacing: -1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: colors.accent, fontWeight: '800', fontSize: 11, letterSpacing: 1.8 },
  signOut: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,59,59,.25)', backgroundColor: 'rgba(255,59,59,.06)', alignItems: 'center', justifyContent: 'center' },
  signOutPressed: { backgroundColor: 'rgba(255,59,59,.12)' },
});
