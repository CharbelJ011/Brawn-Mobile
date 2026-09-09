import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { BrawnHeader } from '@/components/BrawnHeader';
import { ProfileAccountActions } from '@/components/ProfileAccountActions';
import { apiRequest } from '@/api/client';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type ProfileKind = 'MEMBER' | 'STAFF';

type ErpProfile = {
  id: string;
  gymId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  status: string;
  appUsername: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  gym: { id: string; name: string; slug: string };
  memberNumber?: string;
  gender?: string | null;
  emergencyContactRelation?: string | null;
  joinedAt?: string;
  employeeNumber?: string;
  hiredAt?: string;
  role?: { id: string; name: string; category: string };
  changedFields?: string[];
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  gender: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
};

const emptyForm: FormState = {
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', address: '', gender: '',
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
};

function formFromProfile(profile: ErpProfile): FormState {
  return {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    address: profile.address ?? '',
    gender: profile.gender ?? '',
    emergencyContactName: profile.emergencyContactName ?? '',
    emergencyContactPhone: profile.emergencyContactPhone ?? '',
    emergencyContactRelation: profile.emergencyContactRelation ?? '',
  };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value || '—'}</Text></View>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'sentences' }: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  return <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedDark} keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoCorrect={false} style={styles.input}/>
  </View>;
}

export function ErpMobileProfileScreen({ kind }: { kind: ProfileKind }) {
  const isMember = kind === 'MEMBER';
  const endpoint = isMember ? '/mobile-auth/member/profile' : '/mobile-auth/staff/profile';
  const [profile, setProfile] = useState<ErpProfile | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const result = await apiRequest<ErpProfile>(endpoint);
      setProfile(result); setForm(formFromProfile(result));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load your profile.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [endpoint]);

  const dirty = useMemo(() => profile ? JSON.stringify(form) !== JSON.stringify(formFromProfile(profile)) : false, [form, profile]);
  const initials = `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase() || (isMember ? 'M' : 'S');

  async function save() {
    if (!profile || saving || !dirty) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const body: Record<string, string | null> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
        dateOfBirth: form.dateOfBirth || null,
        address: form.address || null,
        emergencyContactName: form.emergencyContactName || null,
        emergencyContactPhone: form.emergencyContactPhone || null,
      };
      if (isMember) {
        body.gender = form.gender || null;
        body.emergencyContactRelation = form.emergencyContactRelation || null;
      }
      const result = await apiRequest<ErpProfile>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
      setProfile(result); setForm(formFromProfile(result));
      setSuccess(result.changedFields?.length ? 'Profile updated in Brawn ERP. Your gym has been notified.' : 'Your profile is already up to date.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update your profile.');
    } finally { setSaving(false); }
  }

  return <Screen><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <BrawnHeader label={isMember ? 'MEMBER' : 'TRAINER'} />
    <View style={styles.hero}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
      <View style={styles.heroText}><Text style={styles.eyebrow}>YOUR BRAWN PROFILE</Text><Text style={styles.title}>{profile ? `${profile.firstName} ${profile.lastName}` : 'Profile'}</Text><Text style={styles.subtitle}>Connected directly to your gym's ERP record.</Text></View>
    </View>

    {loading ? <View style={styles.loadingCard}><ActivityIndicator color={colors.accent}/><Text style={styles.loadingText}>Loading ERP profile…</Text></View> : null}
    {!loading && error && !profile ? <View style={styles.messageCard}><Text style={styles.errorText}>{error}</Text><Pressable onPress={load} style={styles.retryButton}><Text style={styles.retryText}>TRY AGAIN</Text></Pressable></View> : null}

    {profile ? <>
      <View style={styles.card}>
        <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>ERP IDENTITY</Text><Text style={styles.sectionTitle}>{isMember ? 'Member record' : 'Staff record'}</Text></View><View style={styles.syncPill}><View style={styles.syncDot}/><Text style={styles.syncText}>LIVE</Text></View></View>
        <InfoRow label="Gym" value={profile.gym.name}/>
        <InfoRow label={isMember ? 'Member number' : 'Employee number'} value={isMember ? profile.memberNumber ?? '—' : profile.employeeNumber ?? '—'}/>
        <InfoRow label="App username" value={profile.appUsername ?? '—'}/>
        <InfoRow label={isMember ? 'Member status' : 'Staff status'} value={profile.status}/>
        {isMember ? <InfoRow label="Joined" value={profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : '—'}/> : <><InfoRow label="Role" value={profile.role?.name ?? '—'}/><InfoRow label="Role category" value={profile.role?.category ?? '—'}/><InfoRow label="Hired" value={profile.hiredAt ? new Date(profile.hiredAt).toLocaleDateString() : '—'}/></>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionEyebrow}>PERSONAL DETAILS</Text><Text style={styles.sectionTitle}>About you</Text>
        <Text style={styles.sectionHint}>{isMember ? 'These fields are stored on the same member record used by your gym.' : 'Only personal/contact fields can be changed here. Employment, role, payroll and access remain controlled by the gym.'}</Text>
        <View style={styles.twoColumns}><Field label="First name" value={form.firstName} onChangeText={value=>setForm(old=>({...old,firstName:value}))} autoCapitalize="words"/><Field label="Last name" value={form.lastName} onChangeText={value=>setForm(old=>({...old,lastName:value}))} autoCapitalize="words"/></View>
        <Field label="Email" value={form.email} onChangeText={value=>setForm(old=>({...old,email:value}))} placeholder="john.doe@example.com" keyboardType="email-address" autoCapitalize="none"/>
        <Field label="Phone" value={form.phone} onChangeText={value=>setForm(old=>({...old,phone:value}))} placeholder="+961 …" keyboardType="phone-pad" autoCapitalize="none"/>
        <View style={styles.twoColumns}>{isMember ? <Field label="Gender" value={form.gender} onChangeText={value=>setForm(old=>({...old,gender:value}))} placeholder="Optional" autoCapitalize="words"/> : null}<Field label="Date of birth" value={form.dateOfBirth} onChangeText={value=>setForm(old=>({...old,dateOfBirth:value}))} placeholder="YYYY-MM-DD" autoCapitalize="none"/></View>
        <Field label="Address" value={form.address} onChangeText={value=>setForm(old=>({...old,address:value}))} placeholder="Your current address"/>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionEyebrow}>EMERGENCY CONTACT</Text><Text style={styles.sectionTitle}>Someone your gym can contact</Text>
        <Field label="Full name" value={form.emergencyContactName} onChangeText={value=>setForm(old=>({...old,emergencyContactName:value}))} placeholder="Contact name" autoCapitalize="words"/>
        <Field label="Phone" value={form.emergencyContactPhone} onChangeText={value=>setForm(old=>({...old,emergencyContactPhone:value}))} placeholder="Contact phone" keyboardType="phone-pad" autoCapitalize="none"/>
        {isMember ? <Field label="Relationship" value={form.emergencyContactRelation} onChangeText={value=>setForm(old=>({...old,emergencyContactRelation:value}))} placeholder="e.g. Parent, partner, friend" autoCapitalize="words"/> : null}
      </View>

      <View style={styles.noticeCard}><Text style={styles.noticeTitle}>ERP SYNC</Text><Text style={styles.noticeText}>When you change profile information, Brawn updates your ERP record and sends the gym a notification listing the fields you changed.</Text></View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}{success ? <Text style={styles.successText}>{success}</Text> : null}
      <Pressable onPress={save} disabled={!dirty || saving} style={({pressed})=>[styles.saveButton,(!dirty||saving)&&styles.saveButtonDisabled,pressed&&dirty&&!saving&&styles.saveButtonPressed]}>{saving?<ActivityIndicator color="#fff"/>:<Text style={styles.saveText}>{dirty?'SAVE CHANGES':'PROFILE UP TO DATE'}</Text>}</Pressable>
      <View style={styles.securityGap}/><ProfileAccountActions/>
    </> : null}
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content:{padding:20,paddingBottom:42},hero:{flexDirection:'row',alignItems:'center',gap:16,marginTop:32,marginBottom:22},avatar:{width:66,height:66,borderRadius:22,borderWidth:1,borderColor:'rgba(255,59,59,.35)',backgroundColor:'rgba(255,59,59,.08)',alignItems:'center',justifyContent:'center'},avatarText:{color:colors.accent,fontWeight:'900',fontSize:21,letterSpacing:1},heroText:{flex:1},eyebrow:{color:colors.accent,fontSize:9,fontWeight:'900',letterSpacing:1.9},title:{color:colors.foregroundStrong,fontSize:29,fontWeight:'900',letterSpacing:-1,marginTop:4},subtitle:{color:colors.muted,fontSize:12,lineHeight:18,marginTop:4},card:{borderWidth:1,borderColor:colors.line,borderRadius:radii.xl,backgroundColor:'rgba(17,19,17,.9)',padding:spacing.lg,marginBottom:14},loadingCard:{minHeight:150,borderWidth:1,borderColor:colors.line,borderRadius:radii.xl,alignItems:'center',justifyContent:'center',gap:12},loadingText:{color:colors.muted,fontSize:12},messageCard:{borderWidth:1,borderColor:colors.line,borderRadius:radii.xl,padding:20},sectionHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8},sectionEyebrow:{color:colors.accent,fontSize:9,fontWeight:'900',letterSpacing:1.7},sectionTitle:{color:colors.foreground,fontSize:18,fontWeight:'800',marginTop:4,marginBottom:8},sectionHint:{color:colors.muted,fontSize:11,lineHeight:17,marginBottom:16},syncPill:{flexDirection:'row',alignItems:'center',gap:6,borderWidth:1,borderColor:'rgba(85,217,140,.2)',backgroundColor:'rgba(85,217,140,.06)',borderRadius:999,paddingHorizontal:9,paddingVertical:6},syncDot:{width:6,height:6,borderRadius:999,backgroundColor:'#55d98c'},syncText:{color:'#55d98c',fontSize:8,fontWeight:'900',letterSpacing:1.2},infoRow:{minHeight:43,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:15,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.055)'},infoLabel:{color:colors.muted,fontSize:11,fontWeight:'700'},infoValue:{flexShrink:1,color:colors.foreground,fontSize:12,fontWeight:'800',textAlign:'right'},twoColumns:{flexDirection:'row',gap:10},field:{flex:1,marginTop:12},fieldLabel:{color:'#c8cbc5',fontSize:11,fontWeight:'700',marginBottom:7},input:{height:50,borderWidth:1,borderColor:colors.line,borderRadius:radii.md,paddingHorizontal:14,backgroundColor:'rgba(4,5,4,.65)',color:colors.foreground,fontSize:14},noticeCard:{borderWidth:1,borderColor:'rgba(255,59,59,.2)',borderRadius:radii.lg,backgroundColor:'rgba(255,59,59,.045)',padding:15,marginBottom:14},noticeTitle:{color:colors.accent,fontSize:9,fontWeight:'900',letterSpacing:1.5},noticeText:{color:colors.muted,fontSize:11,lineHeight:17,marginTop:6},errorText:{color:colors.danger,fontSize:12,fontWeight:'700',marginBottom:10},successText:{color:'#55d98c',fontSize:12,fontWeight:'700',marginBottom:10},retryButton:{marginTop:14,height:44,borderRadius:radii.md,backgroundColor:'rgba(255,59,59,.1)',borderWidth:1,borderColor:'rgba(255,59,59,.35)',alignItems:'center',justifyContent:'center'},retryText:{color:colors.accent,fontSize:10,fontWeight:'900',letterSpacing:1.5},saveButton:{height:54,borderRadius:radii.md,backgroundColor:colors.accent,alignItems:'center',justifyContent:'center'},saveButtonDisabled:{backgroundColor:'rgba(255,255,255,.06)'},saveButtonPressed:{transform:[{scale:.99}]},saveText:{color:'#fff',fontSize:11,fontWeight:'900',letterSpacing:1.7},securityGap:{height:16},
});
