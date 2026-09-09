import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useUnreadChatCount } from '@/chat/useUnreadChatCount';
import { colors } from '@/theme/colors';

function ChatIcon({ color, size, unread }: { color: string; size: number; unread: number }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name="chatbubbles-outline" color={color} size={size} />
      {unread > 0 ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function MemberLayout() {
  const unreadChatCount = useUnreadChatCount();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#0d0f0e', borderTopColor: 'rgba(255,255,255,0.08)', height: 74, paddingTop: 8 },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', paddingBottom: 8 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <ChatIcon color={color} size={size} unread={unreadChatCount} /> }} />
      <Tabs.Screen name="membership" options={{ title: 'Membership', tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  unreadBadge: { position: 'absolute', top: -7, right: -11, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#0d0f0e' },
  unreadBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900', lineHeight: 10 },
});
