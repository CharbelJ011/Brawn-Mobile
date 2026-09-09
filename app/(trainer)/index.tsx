import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { BrawnHeader } from '@/components/BrawnHeader';
import { useAuth } from '@/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

const sessions = [
  { time: '09:00', name: 'Morning PT Session', meta: 'Personal Training · 60 min' },
  { time: '11:30', name: 'Client Session', meta: 'Personal Training · 60 min' },
  { time: '17:00', name: 'Strength Class', meta: 'Class · 9 / 12 booked' },
];

export default function TrainerToday() {
  const { user } = useAuth();
  const name = user?.firstName || user?.username || 'Coach';
  return <Screen><ScrollView contentContainerStyle={styles.content}><BrawnHeader label="TRAINER"/><Text style={styles.kicker}>TODAY · WED 9 SEP</Text><Text style={styles.title}>{name}'s schedule</Text><View style={styles.summary}><View><Text style={styles.metric}>3</Text><Text style={styles.metricLabel}>SESSIONS</Text></View><View style={styles.divider}/><View><Text style={styles.metric}>1</Text><Text style={styles.metricLabel}>CLASS</Text></View><View style={styles.divider}/><View><Text style={styles.metric}>4h</Text><Text style={styles.metricLabel}>COACHING</Text></View></View><Text style={styles.section}>YOUR DAY</Text>{sessions.map((session,index)=><View style={styles.row} key={session.time}><View style={styles.timeLine}><Text style={styles.time}>{session.time}</Text><View style={[styles.dot,index===0&&styles.dotActive]}/>{index<sessions.length-1?<View style={styles.line}/>:null}</View><View style={styles.card}><View style={styles.flex}><Text style={styles.sessionName}>{session.name}</Text><Text style={styles.meta}>{session.meta}</Text></View><Ionicons name="chevron-forward" color={colors.muted} size={20}/></View></View>)}</ScrollView></Screen>;
}
const styles=StyleSheet.create({content:{paddingHorizontal:20,paddingTop:12,paddingBottom:30},kicker:{color:colors.accent,fontSize:10,fontWeight:'900',letterSpacing:2.1,marginTop:38},title:{color:colors.foreground,fontSize:31,fontWeight:'850',letterSpacing:-1.1,marginTop:7},summary:{marginTop:24,borderRadius:radii.lg,borderWidth:1,borderColor:colors.line,backgroundColor:'rgba(21,24,21,.88)',paddingVertical:18,paddingHorizontal:20,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},metric:{color:colors.foreground,fontSize:23,fontWeight:'900',textAlign:'center'},metricLabel:{color:colors.muted,fontSize:8,fontWeight:'900',letterSpacing:1.2,marginTop:4},divider:{width:1,height:36,backgroundColor:colors.line},section:{color:colors.muted,fontSize:10,fontWeight:'900',letterSpacing:2,marginTop:34,marginBottom:12},row:{flexDirection:'row',minHeight:92},timeLine:{width:62,alignItems:'flex-start'},time:{color:'#c8cbc5',fontSize:11,fontWeight:'800'},dot:{position:'absolute',top:28,left:12,width:9,height:9,borderRadius:99,backgroundColor:'#505650'},dotActive:{backgroundColor:colors.accent},line:{position:'absolute',top:38,left:16,width:1,height:54,backgroundColor:colors.lineStrong},card:{flex:1,alignSelf:'flex-start',minHeight:72,borderRadius:radii.md,borderWidth:1,borderColor:colors.line,backgroundColor:'#0d0f0e',padding:15,flexDirection:'row',alignItems:'center'},flex:{flex:1},sessionName:{color:colors.foreground,fontSize:14,fontWeight:'800'},meta:{color:colors.muted,fontSize:11,marginTop:6}});
