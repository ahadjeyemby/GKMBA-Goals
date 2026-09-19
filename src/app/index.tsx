import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-ledger-bg dark:bg-ledger-dark">
        <ActivityIndicator color="#C2255C" />
      </View>
    );
  }

  return <Redirect href={session ? '/(app)/today' : '/(auth)/sign-in'} />;
}
