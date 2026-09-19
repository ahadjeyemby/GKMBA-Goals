import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useWeeklyGoals } from '@/hooks/use-weekly-goals';
import { dayIndexOf } from '@/lib/api/seasons';
import { currentStreak, hasMissedToday, weeklyPct } from '@/lib/scoring';

type Tab = 'nudges' | 'coach';

export default function Assistant() {
  const [tab, setTab] = useState<Tab>('nudges');

  return (
    <Screen>
      <View className="mt-2 flex-row gap-2 rounded-full bg-ledger-gray/10 p-1">
        <TabButton label="Nudges" active={tab === 'nudges'} onPress={() => setTab('nudges')} />
        <TabButton label="Coach" active={tab === 'coach'} onPress={() => setTab('coach')} />
      </View>
      {tab === 'nudges' ? <Nudges /> : <Coach />}
    </Screen>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-full py-2 ${active ? 'bg-ledger-bg dark:bg-ledger-dark' : ''}`}>
      <Text className={`font-semibold ${active ? 'text-ledger-red' : 'text-ledger-gray'}`}>{label}</Text>
    </Pressable>
  );
}

function Nudges() {
  const { goals, isLoading } = useWeeklyGoals();
  const todayIndex = dayIndexOf(new Date());
  const setGoals = goals.filter((g) => g.id);

  if (isLoading) return <ActivityIndicator color="#C2255C" className="mt-8" />;

  const missedToday = hasMissedToday(
    setGoals.map((g) => ({ completedDays: g.completedDays })),
    todayIndex,
  );
  const pct = weeklyPct(setGoals.map((g) => ({ completedDays: g.completedDays })));

  return (
    <View className="mt-4 gap-3">
      <Text className="text-xs uppercase text-ledger-gray">
        Rule-based, on-device — no AI calls, no cost
      </Text>

      {missedToday && setGoals.length > 0 ? (
        <View className="rounded-2xl bg-status-red/10 p-4">
          <Text className="font-semibold text-status-red">You haven&apos;t checked in today</Text>
          <Text className="mt-1 text-sm text-ledger-gray">
            Head to Today and tick at least one goal before the day ends.
          </Text>
        </View>
      ) : null}

      {setGoals.length === 0 ? (
        <View className="rounded-2xl bg-ledger-gray/10 p-4">
          <Text className="font-semibold">Set your goals for this week</Text>
          <Text className="mt-1 text-sm text-ledger-gray">
            You don&apos;t have any weekly goals yet — set them on the Today tab.
          </Text>
        </View>
      ) : null}

      {setGoals.map((goal) => {
        const streak = currentStreak(goal.completedDays);
        if (streak === 0) return null;
        return (
          <View key={goal.goalNumber} className="rounded-2xl border border-ledger-gray/20 p-4">
            <Text className="font-semibold">🔥 {streak}-day streak</Text>
            <Text className="mt-1 text-sm text-ledger-gray">{goal.text}</Text>
          </View>
        );
      })}

      <View className="rounded-2xl border border-ledger-gray/20 p-4">
        <Text className="font-semibold">This week so far</Text>
        <Text className="mt-1 text-sm text-ledger-gray">{Math.round(pct * 100)}% of your ticks logged</Text>
      </View>
    </View>
  );
}

function Coach() {
  return (
    <View className="mt-4 gap-3">
      <View className="rounded-2xl border border-ledger-gray/20 p-4">
        <Text className="font-semibold">AI Coach — coming soon</Text>
        <Text className="mt-2 text-sm text-ledger-gray">
          Conversational check-ins, weekly AI summaries, and goal breakdowns will run on either the
          app&apos;s hosted agent (Google Cloud Gemini Enterprise Agent Platform) or a provider/endpoint
          you connect yourself in Settings — never a &quot;connect your ChatGPT/Claude subscription&quot;
          flow, since no provider exposes that publicly.
        </Text>
      </View>
      <View className="rounded-2xl bg-ledger-gray/10 p-4">
        <Text className="text-sm text-ledger-gray">
          This ships in Phase 4 of the build (see the project plan). For now, Nudges covers reminders,
          streaks, and missed-day alerts with no AI cost.
        </Text>
      </View>
    </View>
  );
}
