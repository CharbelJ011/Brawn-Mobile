import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { colors } from '@/theme/colors';

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color={colors.accent} /></View>;
  }
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.userType === 'MEMBER' || user.memberId) return <Redirect href="/(member)" />;
  return <Redirect href="/(trainer)" />;
}

const styles = StyleSheet.create({ loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' } });
