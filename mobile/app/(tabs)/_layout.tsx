import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 8, borderTopWidth: 0, elevation: 12 }
      }}
    >
      <Tabs.Screen name="diet" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color }) => <Ionicons name="trending-up" size={22} color={color} /> }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recipes', tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={22} color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} /> }} />
    </Tabs>
  );
}
