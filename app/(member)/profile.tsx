import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { BrawnHeader } from '@/components/BrawnHeader';
import { colors } from '@/theme/colors';
export default function Placeholder() { return <Screen><View style={styles.content}><BrawnHeader label="MEMBER" /><Text style={styles.title}>Profile</Text><Text style={styles.text}>This module is ready for ERP integration.</Text></View></Screen>; }
const styles = StyleSheet.create({ content:{flex:1,padding:20}, title:{color:colors.foreground,fontSize:32,fontWeight:'900',marginTop:42},text:{color:colors.muted,marginTop:10} });
