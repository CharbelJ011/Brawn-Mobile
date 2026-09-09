import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

export function Screen({ children }: PropsWithChildren) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#130b0b', colors.background, '#0a0b09']}
        locations={[0, 0.54, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glow} />
      <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  glow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 320,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(255,59,59,0.09)',
  },
});
