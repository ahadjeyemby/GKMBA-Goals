import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useCurrentGroup } from '@/hooks/use-current-group';
import { useWeeklyGoals, type WeeklyGoalWithCheckins } from '@/hooks/use-weekly-goals';
import { addMediaProof, addTextOrLinkProof } from '@/lib/api/proofs';
import { dayIndexOf, DAY_LABELS } from '@/lib/api/seasons';
import { currentStreak } from '@/lib/scoring';

export default function Today() {
  const { group, userId, isLoading: groupLoading } = useCurrentGroup();
  const { goals, isLoading, setGoalText, toggleDay } = useWeeklyGoals();
  const todayIndex = dayIndexOf(new Date());

  if (groupLoading || isLoading) {
    return (
      <Screen>
        <ActivityIndicator color="#D21F3C" className="mt-16" />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <Text className="text-2xl font-bold">Today · {DAY_LABELS[todayIndex]}</Text>
        <Text className="text-base text-ledger-gray">{group?.name}</Text>
      </View>

      {goals.map((goal) => (
        <GoalCard
          key={goal.goalNumber}
          goal={goal}
          todayIndex={todayIndex}
          groupId={group?.id ?? ''}
          userId={userId ?? ''}
          onSaveText={(text) => setGoalText({ goalNumber: goal.goalNumber, text })}
          onToggleToday={(completed) =>
            goal.id &&
            toggleDay({ weeklyGoalId: goal.id, dayOfWeek: todayIndex, completed })
          }
        />
      ))}
    </Screen>
  );
}

function GoalCard({
  goal,
  todayIndex,
  groupId,
  userId,
  onSaveText,
  onToggleToday,
}: {
  goal: WeeklyGoalWithCheckins;
  todayIndex: number;
  groupId: string;
  userId: string;
  onSaveText: (text: string) => void;
  onToggleToday: (completed: boolean) => void;
}) {
  const [draft, setDraft] = useState(goal.text);
  const [proofText, setProofText] = useState('');
  const [proofSaved, setProofSaved] = useState(false);
  const streak = currentStreak(goal.completedDays);
  const doneToday = goal.completedDays[todayIndex];

  if (!goal.id) {
    return (
      <View className="gap-2 rounded-2xl border border-ledger-gray/20 p-4">
        <Text className="text-sm font-semibold text-ledger-gray">
          GOAL {goal.goalNumber} · not set yet
        </Text>
        <TextField
          placeholder="Write one clear, specific goal for this week"
          value={draft}
          onChangeText={setDraft}
        />
        <Button onPress={() => onSaveText(draft)} disabled={!draft.trim()}>
          Save Goal
        </Button>
      </View>
    );
  }

  async function pickMedia(type: 'photo' | 'video') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'photo' ? ['images'] : ['videos'],
      quality: 0.7,
    });
    if (result.canceled || !goal.id) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() ?? (type === 'photo' ? 'jpg' : 'mp4');
    await addMediaProof({
      groupId,
      userId,
      weeklyGoalId: goal.id,
      type,
      localUri: asset.uri,
      fileExt: ext,
    });
    setProofSaved(true);
  }

  async function saveTextProof() {
    if (!goal.id || !proofText.trim()) return;
    const isLink = /^https?:\/\//.test(proofText.trim());
    await addTextOrLinkProof(goal.id, isLink ? 'link' : 'text', proofText.trim());
    setProofSaved(true);
    setProofText('');
  }

  return (
    <View className="gap-3 rounded-2xl border border-ledger-gray/20 p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold">{goal.text}</Text>
        {streak > 0 ? (
          <Text className="text-sm font-semibold text-status-orange">🔥 {streak}</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => onToggleToday(!doneToday)}
        className={`flex-row items-center justify-center gap-2 rounded-xl py-3 ${
          doneToday ? 'bg-status-green/15' : 'bg-ledger-gray/10'
        }`}>
        <Text className={`font-semibold ${doneToday ? 'text-status-green' : 'text-ledger-gray'}`}>
          {doneToday ? 'Done today ✓' : 'Mark today done'}
        </Text>
      </Pressable>

      {doneToday && !proofSaved ? (
        <View className="gap-2 border-t border-ledger-gray/10 pt-3">
          <Text className="text-sm font-medium text-ledger-gray">Drop your proof</Text>
          <TextField
            placeholder="Paste a link or note"
            value={proofText}
            onChangeText={setProofText}
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button variant="secondary" onPress={saveTextProof}>
                Save Note/Link
              </Button>
            </View>
            <View className="flex-1">
              <Button variant="secondary" onPress={() => pickMedia('photo')}>
                Add Photo
              </Button>
            </View>
          </View>
        </View>
      ) : null}
      {proofSaved ? <Text className="text-sm text-status-green">Proof saved ✓</Text> : null}
    </View>
  );
}
