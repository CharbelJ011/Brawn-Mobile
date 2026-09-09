import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest } from '@/api/client';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

export function ProfileAccountActions() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  async function changePassword() {
    if (savingPassword) return;
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 8) {
      setPasswordError('New password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await apiRequest('/mobile-auth/profile/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Your Brawn Mobile password has been changed.');
    } catch (caught) {
      setPasswordError(caught instanceof Error ? caught.message : 'Unable to change your password.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>ACCOUNT SECURITY</Text>
      <Text style={styles.title}>Change mobile password</Text>
      <Text style={styles.hint}>This changes only your Brawn Mobile password. Your gym ERP login is not affected.</Text>
      <Text style={styles.label}>Current password</Text>
      <TextInput value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Current password" placeholderTextColor={colors.mutedDark} />
      <Text style={styles.label}>New password</Text>
      <TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Minimum 8 characters" placeholderTextColor={colors.mutedDark} />
      <Text style={styles.label}>Confirm new password</Text>
      <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Repeat new password" placeholderTextColor={colors.mutedDark} />
      {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
      {passwordSuccess ? <Text style={styles.success}>{passwordSuccess}</Text> : null}
      <Pressable onPress={changePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} style={[styles.changeButton, (savingPassword || !currentPassword || !newPassword || !confirmPassword) && styles.disabled]}>
        {savingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.changeText}>CHANGE PASSWORD</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radii.xl, backgroundColor: 'rgba(17,19,17,.9)', padding: 18, marginBottom: 14 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 4 },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 7, marginBottom: 10 },
  label: { color: '#c8cbc5', fontSize: 11, fontWeight: '700', marginTop: 11, marginBottom: 7 },
  input: { height: 50, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, paddingHorizontal: 14, backgroundColor: 'rgba(4,5,4,.65)', color: colors.foreground, fontSize: 14 },
  error: { color: colors.danger, fontSize: 11, fontWeight: '700', marginTop: 10 },
  success: { color: '#55d98c', fontSize: 11, fontWeight: '700', marginTop: 10 },
  changeButton: { height: 50, marginTop: 14, borderRadius: radii.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  changeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  disabled: { opacity: .45 },
});
