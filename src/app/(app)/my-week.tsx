import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useCurrentGroup } from '@/hooks/use-current-group';
import { useWeeklyGoals } from '@/hooks/use-weekly-goals';
import { DAY_LABELS, dayIndexOf } from '@/lib/api/seasons';
import { weeklyPct } from '@/lib/scoring';

export default function MyWeek() {
  const { week, isLoading: groupLoading } = useCurrentGroup();
  const { goals, isLoading, toggleDay } = useWeeklyGoals();
  const todayIndex = dayIndexOf(new Date());
  const setGoals = goals.filter((g) => g.id);
  const pct = weeklyPct(setGoals.map((g) => ({ completedDays: g.completedDays })));

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
        <Text className="text-2xl font-bold">My Week</Text>
        <Text className="text-sm text-ledger-gray">
          Week of {week?.week_start_date} — only today and past days are editable.
        </Text>
        <StatusBadge pct={pct} />
      </View>

      {setGoals.length === 0 ? (
        <Text className="mt-4 text-ledger-gray">
          Set your 3 goals from the Today tab to start tracking your week.
        </Text>
      ) : null}

      {setGoals.map((goal) => (
        <View key={goal.goalNumber} className="gap-2 rounded-2xl border border-ledger-gray/20 p-4">
          <Text className="text-base font-semibold">{goal.text}</Text>
          <View className="flex-row justify-between">
            {DAY_LABELS.map((label, dayIndex) => {
              const editable = dayIndex <= todayIndex;
              const done = goal.completedDays[dayIndex];
              return (
                <Pressable
                  key={label}
                  disabled={!editable || !goal.id}
                  onPress={() =>
                    goal.id &&
                    toggleDay({ weeklyGoalId: goal.id, dayOfWeek: dayIndex, completed: !done })
                  }
                  className="items-center gap-1">
                  <Text className="text-xs text-ledger-gray">{label[0]}</Text>
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      done
                        ? 'bg-status-green'
                        : editable
                          ? 'border border-ledger-gray/40'
                          : 'bg-ledger-gray/10'
                    }`}>
                    {done ? <Text className="text-white">✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}
