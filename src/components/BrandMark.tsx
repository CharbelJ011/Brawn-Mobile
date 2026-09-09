import { View, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

export function BrandMark({ size = 34 }: { size?: number }) {
  const scale = size / 34;
  return (
    <View style={[styles.root, { width: size, height: size * 0.68, transform: [{ rotate: '-12deg' }] }]}>
      <View style={[styles.bar, { width: 22 * scale, height: 5 * scale }]} />
      <View style={[styles.plate, { left: 2 * scale, width: 5 * scale, height: 16 * scale }]} />
      <View style={[styles.plate, { left: 8 * scale, width: 5 * scale, height: 21 * scale }]} />
      <View style={[styles.plate, { right: 8 * scale, width: 5 * scale, height: 21 * scale }]} />
      <View style={[styles.plate, { right: 2 * scale, width: 5 * scale, height: 16 * scale }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  bar: { borderRadius: 2, backgroundColor: colors.accent },
  plate: { position: 'absolute', borderRadius: 2, backgroundColor: colors.foreground },
});
