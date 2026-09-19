import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { useCurrentGroup } from '@/hooks/use-current-group';

export default function AppLayout() {
  const { session, isLoading: authLoading } = useAuth();
  const { hasNoGroup, isLoading: groupLoading } = useCurrentGroup();

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-ledger-dark">
        <ActivityIndicator color="#D21F3C" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (!groupLoading && hasNoGroup) return <Redirect href="/(auth)/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D21F3C',
      }}>
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="my-week" options={{ title: 'My Week' }} />
      <Tabs.Screen name="hundred-day" options={{ title: '100-Day' }} />
      <Tabs.Screen name="group" options={{ title: 'Group' }} />
      <Tabs.Screen name="assistant" options={{ title: 'Assistant' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
