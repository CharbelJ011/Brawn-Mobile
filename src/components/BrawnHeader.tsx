import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from './BrandMark';
import { colors } from '@/theme/colors';

export function BrawnHeader({ label }: { label?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <BrandMark size={30} />
        <Text style={styles.wordmark}>BRAWN</Text>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { color: colors.foregroundStrong, fontWeight: '900', fontSize: 20, letterSpacing: -1 },
  label: { color: colors.accent, fontWeight: '800', fontSize: 11, letterSpacing: 1.8 },
});
