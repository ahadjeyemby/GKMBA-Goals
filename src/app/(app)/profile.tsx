import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/hooks/use-auth';
import { getNotificationPrefs, setNotificationPrefs, updateSignatureColor } from '@/lib/api/profile';
import { supabase } from '@/lib/supabase';

const SIGNATURE_COLORS = [
  '#D21F3C',
  '#E08A1E',
  '#1E9E5A',
  '#1F7AD2',
  '#7A3FD2',
  '#D21FA0',
  '#1FA0D2',
  '#8E8E93',
];

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select().eq('id', userId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const prefsQuery = useQuery({
    queryKey: ['notification-prefs', userId],
    queryFn: () => getNotificationPrefs(userId!),
    enabled: !!userId,
  });

  if (profileQuery.isLoading || prefsQuery.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color="#D21F3C" className="mt-16" />
      </Screen>
    );
  }

  const profile = profileQuery.data;
  const prefs = prefsQuery.data;

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <Text className="text-2xl font-bold">{profile?.display_name}</Text>
        <Text className="text-sm text-ledger-gray">{session?.user.email}</Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-ledger-gray">YOUR SIGNATURE COLOR</Text>
        <View className="flex-row flex-wrap gap-3">
          {SIGNATURE_COLORS.map((color) => (
            <Pressable
              key={color}
              onPress={async () => {
                if (!userId) return;
                await updateSignatureColor(userId, color);
                queryClient.invalidateQueries({ queryKey: ['profile', userId] });
              }}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{
                backgroundColor: color,
                borderWidth: profile?.signature_color === color ? 3 : 0,
                borderColor: '#000',
              }}
            />
          ))}
        </View>
      </View>

      <View className="gap-3 rounded-2xl border border-ledger-gray/20 p-4">
        <Text className="text-sm font-semibold text-ledger-gray">NOTIFICATIONS</Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-base">Push reminders</Text>
          <Switch
            value={prefs?.push_enabled ?? true}
            onValueChange={async (value) => {
              if (!userId) return;
              await setNotificationPrefs(userId, { push_enabled: value });
              queryClient.invalidateQueries({ queryKey: ['notification-prefs', userId] });
            }}
          />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-base">Weekly email digest</Text>
          <Switch
            value={prefs?.email_enabled ?? true}
            onValueChange={async (value) => {
              if (!userId) return;
              await setNotificationPrefs(userId, { email_enabled: value });
              queryClient.invalidateQueries({ queryKey: ['notification-prefs', userId] });
            }}
          />
        </View>
      </View>

      <Button
        variant="secondary"
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        }}>
        Sign Out
      </Button>
    </Screen>
  );
}
