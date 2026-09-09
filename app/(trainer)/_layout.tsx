import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUnreadChatCount } from '@/chat/useUnreadChatCount';
import { colors } from '@/theme/colors';

export default function TrainerLayout() {
  const unreadChatCount = useUnreadChatCount();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#0d0f0e', borderTopColor: 'rgba(255,255,255,.08)', height: 74, paddingTop: 8 },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', paddingBottom: 8 },
      tabBarBadgeStyle: { backgroundColor: colors.accent, color: '#fff', fontSize: 9, fontWeight: '900' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarBadge: unreadChatCount > 0 ? unreadChatCount : undefined, tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="members" options={{ title: 'Members', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
