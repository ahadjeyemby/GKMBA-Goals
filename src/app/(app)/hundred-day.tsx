import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import type { HundredDayGoalWithProgress } from '@/hooks/use-hundred-day-goals';
import { useHundredDayGoals } from '@/hooks/use-hundred-day-goals';
import { hundredDayPct } from '@/lib/scoring';

export default function HundredDay() {
  const { goals, isLoading, weeksElapsed, saveGoal, toggleWeek } = useHundredDayGoals();

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color="#C2255C" className="mt-16" />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <Text className="text-2xl font-bold">100-Day Goals</Text>
        <Text className="text-sm text-ledger-gray">
          Long-term goals for the whole season. Tick a week when you made real progress.
        </Text>
      </View>

      {goals.map((goal) => (
        <GoalCard
          key={goal.goalNumber}
          goal={goal}
          weeksElapsed={weeksElapsed}
          onSave={(text, rewardText) => saveGoal({ goalNumber: goal.goalNumber, text, rewardText })}
          onToggleWeek={(weekNumber, completed) =>
            goal.id && toggleWeek({ goalId: goal.id, weekNumber, completed })
          }
        />
      ))}
    </Screen>
  );
}

function GoalCard({
  goal,
  weeksElapsed,
  onSave,
  onToggleWeek,
}: {
  goal: HundredDayGoalWithProgress;
  weeksElapsed: number;
  onSave: (text: string, rewardText: string) => void;
  onToggleWeek: (weekNumber: number, completed: boolean) => void;
}) {
  const [text, setText] = useState(goal.text);
  const [reward, setReward] = useState(goal.rewardText);
  const weeksTickedCount = goal.weeksTicked.filter(Boolean).length;
  const pct = hundredDayPct(weeksTickedCount, weeksElapsed);

  if (!goal.id) {
    return (
      <View className="gap-2 rounded-2xl border border-ledger-gray/20 p-4">
        <Text className="text-sm font-semibold text-ledger-gray">
          100-DAY GOAL {goal.goalNumber} · not set yet
        </Text>
        <TextField placeholder="A goal that lasts the whole season" value={text} onChangeText={setText} />
        <TextField
          placeholder="Reward when you hit it (optional)"
          value={reward}
          onChangeText={setReward}
        />
        <Button onPress={() => onSave(text, reward)} disabled={!text.trim()}>
          Save Goal
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-2xl border border-ledger-gray/20 p-4">
      <View className="gap-1">
        <Text className="text-base font-semibold">{goal.text}</Text>
        {goal.rewardText ? (
          <Text className="text-sm text-ledger-gray">🎁 {goal.rewardText}</Text>
        ) : null}
      </View>
      <StatusBadge pct={pct} />
      <View className="flex-row flex-wrap gap-2">
        {goal.weeksTicked.map((ticked, i) => {
          const weekNumber = i + 1;
          const available = weekNumber <= weeksElapsed;
          return (
            <Pressable
              key={weekNumber}
              disabled={!available}
              onPress={() => onToggleWeek(weekNumber, !ticked)}
              className={`h-9 w-9 items-center justify-center rounded-lg ${
                ticked ? 'bg-status-green' : available ? 'border border-ledger-gray/40' : 'bg-ledger-gray/10'
              }`}>
              <Text className={`text-xs ${ticked ? 'text-white' : 'text-ledger-gray'}`}>{weekNumber}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
