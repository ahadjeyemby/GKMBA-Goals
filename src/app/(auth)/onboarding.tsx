import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/hooks/use-auth';
import { createGroup, joinGroupByCode } from '@/lib/api/groups';
import { createSeason } from '@/lib/api/seasons';

type Mode = 'choose' | 'create' | 'join';

export default function Onboarding() {
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>('choose');
  const [groupName, setGroupName] = useState('');
  const [weekCount, setWeekCount] = useState('15');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const userId = session?.user.id;

  async function handleCreate() {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      const group = await createGroup(groupName.trim(), userId);
      const weeks = Math.max(1, parseInt(weekCount, 10) || 15);
      await createSeason(group.id, new Date(), weeks);
      router.replace('/(app)/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create group');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setError(null);
    setLoading(true);
    try {
      await joinGroupByCode(inviteCode);
      router.replace('/(app)/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'choose') {
    return (
      <Screen>
        <View className="mt-16 gap-1">
          <Text className="text-3xl font-bold text-ledger-red">Get set up</Text>
          <Text className="text-base text-ledger-gray">
            Start a new accountability group, or join one with an invite code.
          </Text>
        </View>
        <View className="mt-8 gap-3">
          <Button onPress={() => setMode('create')}>Create a Group</Button>
          <Button variant="secondary" onPress={() => setMode('join')}>
            Join with Invite Code
          </Button>
        </View>
      </Screen>
    );
  }

  if (mode === 'create') {
    return (
      <Screen>
        <View className="mt-16 gap-1">
          <Text className="text-2xl font-bold">New Group</Text>
          <Text className="text-base text-ledger-gray">
            You&apos;ll be the admin. Season runs Monday-to-Sunday weeks starting this week.
          </Text>
        </View>
        <View className="mt-8 gap-3">
          <TextField label="Group name" value={groupName} onChangeText={setGroupName} />
          <TextField
            label="Season length (weeks)"
            value={weekCount}
            onChangeText={setWeekCount}
            keyboardType="number-pad"
          />
          {error ? <Text className="text-sm text-status-red">{error}</Text> : null}
          <Button onPress={handleCreate} loading={loading} disabled={!groupName}>
            Create Group
          </Button>
          <Button variant="secondary" onPress={() => setMode('choose')}>
            Back
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="mt-16 gap-1">
        <Text className="text-2xl font-bold">Join a Group</Text>
        <Text className="text-base text-ledger-gray">Ask your group admin for the invite code.</Text>
      </View>
      <View className="mt-8 gap-3">
        <TextField
          label="Invite code"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
        />
        {error ? <Text className="text-sm text-status-red">{error}</Text> : null}
        <Button onPress={handleJoin} loading={loading} disabled={!inviteCode}>
          Join Group
        </Button>
        <Button variant="secondary" onPress={() => setMode('choose')}>
          Back
        </Button>
      </View>
    </Screen>
  );
}
